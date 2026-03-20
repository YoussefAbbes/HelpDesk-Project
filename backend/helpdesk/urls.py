"""
URL configuration for the HelpDesk CRM project.

All API routes are prefixed with /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # JWT Authentication endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Application endpoints
    path('api/v1/users/', include('users.urls')),
    path('api/v1/tickets/', include('tickets.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/ai/', include('ai_core.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
