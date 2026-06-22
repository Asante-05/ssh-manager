from django.urls import path
from .views import home, delete_server, server_detail

urlpatterns = [
    path('', home, name='home'),
    path('delete/<int:server_id>/', delete_server, name='delete_server'),
    path('server/<int:server_id>/', server_detail, name='server_detail'),
]