"""
Notification model for in-app notifications.

Notifications are created automatically via signals when:
- A ticket is created (notify assigned agent or all agents if unassigned)
- A ticket is assigned (notify the assigned agent)
- A new message is added to a ticket (notify ticket creator or assigned agent)
- AI processing completes (notify assigned agent)
"""

from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification for users."""

    class NotificationType(models.TextChoices):
        TICKET_CREATED = 'TICKET_CREATED', 'New Ticket Created'
        TICKET_ASSIGNED = 'TICKET_ASSIGNED', 'Ticket Assigned'
        NEW_MESSAGE = 'NEW_MESSAGE', 'New Message'
        AI_COMPLETE = 'AI_COMPLETE', 'AI Analysis Complete'
        STATUS_CHANGED = 'STATUS_CHANGED', 'Ticket Status Changed'
        TICKET_RESOLVED = 'TICKET_RESOLVED', 'Ticket Resolved'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='User who receives the notification',
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.TICKET_CREATED,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Related ticket (optional)',
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}: {self.title}"

    def mark_as_read(self):
        """Mark this notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
