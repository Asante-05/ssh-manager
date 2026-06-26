from rest_framework import serializers
from .models import Server, CommandLog


class CommandLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandLog
        fields = ['id', 'command', 'output', 'created_at']


class ServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Server
        fields = ['id', 'name', 'host', 'port', 'username', 'password', 'key_path']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'key_path': {'required': False},
        }