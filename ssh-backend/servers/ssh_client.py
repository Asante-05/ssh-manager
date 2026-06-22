import paramiko

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

    # ONLY add password if it exists
    if server.password:
        connect_kwargs["password"] = server.password

# ----------------------------
    print("CONNECT KWARGS:")
    print(connect_kwargs)
    
    import os
    
    key_path = connect_kwargs.get("key_filename")
    if key_path:
        print("KEY EXISTS:", os.path.exists(key_path))
        print("KEY PATH:", key_path)
# ----------------------------

    ssh.connect(**connect_kwargs)

    stdin, stdout, stderr = ssh.exec_command(command)

    output = stdout.read().decode()
    error = stderr.read().decode()

    ssh.close()

    return output + error