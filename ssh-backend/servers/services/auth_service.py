from django.contrib.auth import authenticate

class AuthenticationError(Exception):
    pass

def authenticate_user(username: str, password: str):
    user = authenticate(username=username, password=password)

    if not user:
        raise AuthenticationError("Invalid credentials")
    return user