from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from servers.views.auth_views import login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('servers.urls')),
    path('api/auth/login/', login, name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]