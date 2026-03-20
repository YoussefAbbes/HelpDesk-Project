"""
Notification serializers for the API.
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification objects."""

    ticket_id = serializers.IntegerField(source='ticket.id', read_only=True, allow_null=True)
    ticket_title = serializers.CharField(source='ticket.title', read_only=True, allow_null=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'ticket_id',
            'ticket_title',
            'is_read',
            'created_at',
            'time_ago',
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'ticket_id', 'created_at']

    def get_time_ago(self, obj):
        """Return a human-readable time difference."""
        from django.utils import timezone
        from django.utils.timesince import timesince
        return timesince(obj.created_at, timezone.now()) + ' ago'
