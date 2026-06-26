from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404


from rest_framework.permissions import IsAuthenticated

from ..models import Server, CommandLog
from ..serializers.server_serializers import ServerSerializer, CommandLogSerializer
from ..ssh_client import run_command


# GET /api/servers/         — list all servers
# POST /api/servers/        — create a server
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def server_list(request):
    if request.method == 'GET':
        servers = Server.objects.all()
        serializer = ServerSerializer(servers, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ServerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# GET /api/servers/<id>/    — get a single server
# DELETE /api/servers/<id>/ — delete a server
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def server_detail(request, server_id):
    server = get_object_or_404(Server, id=server_id)

    if request.method == 'GET':
        serializer = ServerSerializer(server)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        server.delete()
        return Response({'message': 'Server deleted'}, status=status.HTTP_204_NO_CONTENT)


# POST /api/servers/<id>/run/  — run a command on a server
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_server_command(request, server_id):
    server = get_object_or_404(Server, id=server_id)
    command = request.data.get('command')

    if not command:
        return Response({'error': 'No command provided'}, status=status.HTTP_400_BAD_REQUEST)

    output = run_command(server, command)

    log = CommandLog.objects.create(
        server=server,
        command=command,
        output=output
    )

    return Response({
        'command': command,
        'output': output,
        'created_at': log.created_at,
    })


# GET /api/servers/<id>/logs/  — get command history for a server
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def server_logs(request, server_id):
    server = get_object_or_404(Server, id=server_id)
    logs = server.command_logs.order_by('-created_at')
    serializer = CommandLogSerializer(logs, many=True)
    return Response(serializer.data)


# PATCH /api/servers/<id>/update/  — update server details
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_server(request, server_id):
    server = get_object_or_404(Server, id=server_id)
    serializer = ServerSerializer(server, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)