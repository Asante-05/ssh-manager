import io
import paramiko
from .encryption import decrypt_password


def load_private_key(key_content: str):
    """Auto-detect and load any supported private key type."""
    key_file = io.StringIO(key_content)
    for key_class in [paramiko.RSAKey, paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.DSSKey]:
        try:
            key_file.seek(0)
            return key_class.from_private_key(key_file)
        except Exception:
            continue
    raise ValueError("Unsupported or invalid private key format")


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
        key_content = decrypt_password(server.private_key)
        connect_kwargs["pkey"] = load_private_key(key_content)
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