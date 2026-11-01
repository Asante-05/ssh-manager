import io
import paramiko
from .encryption import decrypt_password


def load_private_key(key_content: str):
    """Auto-detect and load any supported private key type."""
    key_file = io.StringIO(key_content)

    key_classes = [
        paramiko.RSAKey,
        paramiko.Ed25519Key,
        paramiko.ECDSAKey,
    ]
    dss_key = getattr(paramiko, "DSSKey", None)
    if dss_key is not None:
        key_classes.append(dss_key)

    for key_class in key_classes:
        try:
            key_file.seek(0)
            return key_class.from_private_key(key_file)
        except Exception:
            continue

    raise ValueError("Unsupported or invalid private key format")


def run_command(server, command):
    ssh = paramiko.SSHClient()

    ssh.load_system_host_keys()
    ssh.set_missing_host_key_policy(paramiko.RejectPolicy())

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

    try:
        ssh.connect(**connect_kwargs, timeout=15, banner_timeout=15, auth_timeout=15)
        stdin, stdout, stderr = ssh.exec_command(command, timeout=120)
        return stdout.read().decode() + stderr.read().decode()
    finally:
        ssh.close()
