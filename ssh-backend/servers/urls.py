from django.urls import path
from .views import server_views

urlpatterns = [
    path('servers/', server_views.server_list, name='server_list'),
    path('servers/<int:server_id>/', server_views.server_detail, name='server_detail'),
    path('servers/<int:server_id>/run/', server_views.run_server_command, name='run_command'),
    path('servers/<int:server_id>/logs/', server_views.server_logs, name='server_logs'),
    path('servers/<int:server_id>/update/', server_views.update_server, name='update_server'),
    path('servers/<int:server_id>/ping/', server_views.ping_server, name='ping_server'),
]