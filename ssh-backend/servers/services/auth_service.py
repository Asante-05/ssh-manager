from django.contrib.auth import authenticate

class AuthenticationError(Exception):
    pass

def authenticate_user(username: str, password: str):
    user = authenticate(username=username, password=password)

    print("AUTH RESULT:", user)

    if not user:
        raise AuthenticationError("Invalid credentials")
    return user