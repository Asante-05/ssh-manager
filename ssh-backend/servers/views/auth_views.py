from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from ..services.auth_service import authenticate_user, AuthenticationError
from ..serializers.auth_serializers import LoginSerializer

@api_view(['POST'])
def login(request):

    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)


    try:
        user = authenticate_user(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )

        refresh = RefreshToken.for_user(user)

        # Here you would typically generate a token or session for the authenticated user
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
            }
        }, status=status.HTTP_200_OK)
    except AuthenticationError as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)