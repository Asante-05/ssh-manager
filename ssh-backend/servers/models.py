from django.db import models
from django.conf import settings

class Server(models.Model):
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.IntegerField(default=22)
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=500, blank=True, null=True)
    key_path = models.CharField(max_length=255, blank=True, null=True)
    private_key = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="servers")
    group = models.CharField(max_length=100, blank=True, null=True)  # stores encrypted key content

    def __str__(self):
        return self.name

class CommandLog(models.Model):
    server = models.ForeignKey(
        Server,
        on_delete=models.CASCADE,
        related_name="command_logs"
    )
    command = models.TextField()
    output = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.command