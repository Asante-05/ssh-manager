import io
import paramiko
from .encryption import decrypt_password

def run_command(server, command):
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
        # Use pasted private key content
        key_content = decrypt_password(server.private_key)
        key_file = io.StringIO(key_content)
        connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(key_file)
    elif server.key_path:
        # Use key file path
        connect_kwargs["key_filename"] = server.key_path
    elif server.password:
        connect_kwargs["password"] = decrypt_password(server.password)

    ssh.connect(**connect_kwargs)
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    ssh.close()

    return output + error