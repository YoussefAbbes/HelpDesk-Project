"""
Signals for automatically creating notifications.

Notifications are triggered when:
- A ticket is created
- A ticket is assigned to an agent
- A new message is added to a ticket
- Ticket status changes
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Notification


@receiver(post_save, sender='tickets.Ticket')
def ticket_created_notification(sender, instance, created, **kwargs):
    """Create notification when a new ticket is created."""
    if created:
        # Notify all agents/admins about new ticket
        from users.models import User
        agents = User.objects.filter(role__in=['AGENT', 'ADMIN'])

        for agent in agents:
            Notification.objects.create(
                recipient=agent,
                notification_type=Notification.NotificationType.TICKET_CREATED,
                title='New Ticket Created',
                message=f'New ticket: "{instance.title}" from {instance.created_by.username}',
                ticket=instance,
            )


@receiver(pre_save, sender='tickets.Ticket')
def track_ticket_changes(sender, instance, **kwargs):
    """Track changes before saving to detect assignment and status changes."""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_assigned_to = old_instance.assigned_to
            instance._old_status = old_instance.status
        except sender.DoesNotExist:
            instance._old_assigned_to = None
            instance._old_status = None
    else:
        instance._old_assigned_to = None
        instance._old_status = None


@receiver(post_save, sender='tickets.Ticket')
def ticket_assignment_notification(sender, instance, created, **kwargs):
    """Create notification when a ticket is assigned."""
    if not created and hasattr(instance, '_old_assigned_to'):
        if instance.assigned_to and instance.assigned_to != instance._old_assigned_to:
            Notification.objects.create(
                recipient=instance.assigned_to,
                notification_type=Notification.NotificationType.TICKET_ASSIGNED,
                title='Ticket Assigned to You',
                message=f'You have been assigned to ticket: "{instance.title}"',
                ticket=instance,
            )


@receiver(post_save, sender='tickets.Ticket')
def ticket_status_notification(sender, instance, created, **kwargs):
    """Create notification when ticket status changes."""
    if not created and hasattr(instance, '_old_status'):
        if instance.status != instance._old_status:
            # Notify ticket creator
            if instance.created_by:
                notification_type = Notification.NotificationType.STATUS_CHANGED
                title = 'Ticket Status Updated'
                message = f'Your ticket "{instance.title}" status changed to {instance.get_status_display()}'

                if instance.status == 'RESOLVED':
                    notification_type = Notification.NotificationType.TICKET_RESOLVED
                    title = 'Ticket Resolved'
                    message = f'Your ticket "{instance.title}" has been resolved'

                Notification.objects.create(
                    recipient=instance.created_by,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    ticket=instance,
                )


@receiver(post_save, sender='tickets.Message')
def message_notification(sender, instance, created, **kwargs):
    """Create notification when a new message is added."""
    if created:
        ticket = instance.ticket

        # Determine who to notify
        recipients = set()

        # If message is from customer, notify assigned agent
        if instance.author == ticket.created_by:
            if ticket.assigned_to:
                recipients.add(ticket.assigned_to)
        else:
            # If message is from agent, notify ticket creator (unless internal)
            if not instance.is_internal and ticket.created_by:
                recipients.add(ticket.created_by)

        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                notification_type=Notification.NotificationType.NEW_MESSAGE,
                title='New Message',
                message=f'New message on ticket "{ticket.title}" from {instance.author.username}',
                ticket=ticket,
            )


def notify_ai_complete(ticket):
    """
    Utility function to create AI completion notification.
    Call this from the AI processing task after analysis is complete.
    """
    if ticket.assigned_to:
        Notification.objects.create(
            recipient=ticket.assigned_to,
            notification_type=Notification.NotificationType.AI_COMPLETE,
            title='AI Analysis Complete',
            message=f'AI analysis finished for ticket "{ticket.title}". Category: {ticket.ai_category}, Sentiment: {ticket.ai_sentiment}',
            ticket=ticket,
        )
