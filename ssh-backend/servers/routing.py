from django.urls import re_path
from servers import consumers

websocket_urlpatterns = [
    re_path(r"ws/servers/(?P<server_id>\d+)/terminal/$", consumers.TerminalConsumer.as_asgi()),
    re_path(r"ws/servers/(?P<server_id>\d+)/ping/$", consumers.PingConsumer.as_asgi()),
]