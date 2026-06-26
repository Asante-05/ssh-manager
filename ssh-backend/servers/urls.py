from django.urls import path
from . import views

urlpatterns = [
    path('servers/', views.server_list, name='server_list'),
    path('servers/<int:server_id>/', views.server_detail, name='server_detail'),
    path('servers/<int:server_id>/run/', views.run_server_command, name='run_command'),
    path('servers/<int:server_id>/logs/', views.server_logs, name='server_logs'),
]