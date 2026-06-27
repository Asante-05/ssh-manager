import io
import json
import asyncio
import subprocess
import paramiko
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from servers.models import Server, CommandLog
from servers.encryption import decrypt_password

def authenticate_ws(query_string):
    params = dict(p.split("=") for p in query_string.split("&") if "=" in p)
    token = params.get("token")
    if not token:
        raise ValueError("No token")
    access_token = AccessToken(token)
    user_id = access_token["user_id"]
    return User.objects.get(id=user_id)


class TerminalConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        query_string = self.scope.get("query_string", b"").decode()
        try:
            self.user = await database_sync_to_async(authenticate_ws)(query_string)
        except Exception:
            await self.close(code=4001)
            return

        self.server_id = self.scope["url_route"]["kwargs"]["server_id"]
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get("command", "").strip()

        if not command:
            return

        try:
            server = await database_sync_to_async(Server.objects.get)(id=self.server_id)
        except Server.DoesNotExist:
            await self.send(json.dumps({"type": "error", "data": "Server not found"}))
            return

        await self.send(json.dumps({"type": "start", "command": command}))

        try:
            output = await database_sync_to_async(self.run_ssh_command)(server, command)
            await self.send(json.dumps({"type": "output", "data": output}))

            await database_sync_to_async(CommandLog.objects.create)(
                server=server,
                command=command,
                output=output,
            )

            await self.send(json.dumps({"type": "done"}))

        except Exception as e:
            await self.send(json.dumps({"type": "error", "data": str(e)}))

    def run_ssh_command(self, server, command):
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        connect_kwargs = {
            "hostname": server.host,
            "username": server.username,
            "port": server.port,
            "look_for_keys": False,
            "allow_agent": False,
        }

        if server.private_key:
            key_content = decrypt_password(server.private_key)
            key_file = io.StringIO(key_content)
            connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(key_file)
        elif server.key_path:
            connect_kwargs["key_filename"] = server.key_path
        elif server.password:
            connect_kwargs["password"] = decrypt_password(server.password)

        ssh.connect(**connect_kwargs)
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        ssh.close()

        return output + error


class PingConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        query_string = self.scope.get("query_string", b"").decode()
        try:
            self.user = await database_sync_to_async(authenticate_ws)(query_string)
        except Exception:
            await self.close(code=4001)
            return

        self.server_id = self.scope["url_route"]["kwargs"]["server_id"]
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action != "ping":
            return

        try:
            server = await database_sync_to_async(Server.objects.get)(id=self.server_id)
        except Server.DoesNotExist:
            await self.send(json.dumps({"type": "error", "data": "Server not found"}))
            return

        await self.send(json.dumps({"type": "start", "host": server.host}))

        # Run ping with 4 packets and stream each line
        process = await asyncio.create_subprocess_exec(
            "ping", "-c", "4", server.host,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async for line in process.stdout:
            await self.send(json.dumps({
                "type": "output",
                "data": line.decode().rstrip()
            }))

        await process.wait()

        status = "online" if process.returncode == 0 else "offline"
        await self.send(json.dumps({"type": "done", "status": status}))