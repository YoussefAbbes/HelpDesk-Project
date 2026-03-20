"""
Notification API views.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and reading notifications.

    Endpoints:
    - GET /notifications/ - List notifications for the current user
    - GET /notifications/{id}/ - Get a single notification
    - GET /notifications/unread-count/ - Get unread notification count
    - POST /notifications/{id}/mark-read/ - Mark a notification as read
    - POST /notifications/mark-all-read/ - Mark all notifications as read
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return notifications for the current user only."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('ticket')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Return count of unread notifications."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read', 'count': updated})

    @action(detail=True, methods=['delete'])
    def delete(self, request, pk=None):
        """Delete a notification."""
        notification = self.get_object()
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        """Delete all notifications for the current user."""
        deleted_count, _ = self.get_queryset().delete()
        return Response({'status': 'all cleared', 'count': deleted_count})
