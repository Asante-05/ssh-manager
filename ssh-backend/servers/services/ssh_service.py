# servers/services/ssh_service.py

import paramiko


class SSHConnectionError(Exception):
    pass


class SSHService:
    """
    Handles SSH connections and command execution.
    This is a pure service layer (no Django dependencies).
    """

    def __init__(self, host, username, password=None, key=None, port=22):
        self.host = host
        self.username = username
        self.password = password
        self.key = key
        self.port = port
        self.client = None

    def connect(self):
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            if self.key:
                self.client.connect(
                    hostname=self.host,
                    username=self.username,
                    key_filename=self.key,
                    port=self.port,
                )
            else:
                self.client.connect(
                    hostname=self.host,
                    username=self.username,
                    password=self.password,
                    port=self.port,
                )

        except Exception as e:
            raise SSHConnectionError(f"Failed to connect to {self.host}: {str(e)}")

    def run_command(self, command: str):
        if not self.client:
            self.connect()

        stdin, stdout, stderr = self.client.exec_command(command)

        output = stdout.read().decode("utf-8")
        error = stderr.read().decode("utf-8")

        return {
            "command": command,
            "output": output.strip(),
            "error": error.strip(),
        }

    def close(self):
        if self.client:
            self.client.close()
            self.client = None