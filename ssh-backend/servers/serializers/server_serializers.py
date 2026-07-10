from rest_framework import serializers
from ..models import Server, CommandLog
from ..encryption import encrypt_password

class CommandLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandLog
        fields = ['id', 'command', 'output', 'created_at']

class ServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Server
        fields = ['id', 'name', 'host', 'port', 'username', 'password', 'key_path', 'private_key']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'private_key': {'write_only': True, 'required': False},
            'key_path': {'required': False},
        }

    def create(self, validated_data):
        if validated_data.get('password'):
            validated_data['password'] = encrypt_password(validated_data['password'])
        if validated_data.get('private_key'):
            validated_data['private_key'] = encrypt_password(validated_data['private_key'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get('password'):
            validated_data['password'] = encrypt_password(validated_data['password'])
        if validated_data.get('private_key'):
            validated_data['private_key'] = encrypt_password(validated_data['private_key'])
        return super().update(instance, validated_data)