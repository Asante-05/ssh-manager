from django.db import models

# Create your models here.
class Server(models.Model):
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    #ip_address = models.GenericIPAddressField()
    port = models.IntegerField(default=22)
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100, blank=True, null=True)
    key_path = models.CharField(max_length=255, blank=True, null=True)

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