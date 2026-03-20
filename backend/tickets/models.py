"""
Ticket and Message models — the core of the HelpDesk CRM.

Key design decisions:
  - Tickets store AI-predicted fields that are populated asynchronously
    by Celery tasks after creation.
  - Messages belong to a ticket and allow threaded conversations.
  - SLA tracking fields (first_response_at, resolved_at) enable BI metrics.
"""

from django.db import models
from django.conf import settings


class Ticket(models.Model):
    """A support ticket submitted by a customer."""

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        PENDING = 'PENDING', 'Pending Customer'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    class Category(models.TextChoices):
        BILLING = 'BILLING', 'Billing'
        TECH_SUPPORT = 'TECH_SUPPORT', 'Technical Support'
        BUG = 'BUG', 'Bug Report'
        FEATURE = 'FEATURE', 'Feature Request'
        GENERAL = 'GENERAL', 'General Inquiry'
        OTHER = 'OTHER', 'Other'

    class Sentiment(models.TextChoices):
        POSITIVE = 'POSITIVE', 'Positive'
        NEUTRAL = 'NEUTRAL', 'Neutral'
        NEGATIVE = 'NEGATIVE', 'Negative / Urgent'

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.OPEN
    )

    # Relationships
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        limit_choices_to={'role__in': ('AGENT', 'ADMIN')},
    )

    # -----------------------------------------------------------------------
    # AI / ML fields — populated asynchronously by Celery tasks
    # -----------------------------------------------------------------------
    ai_category = models.CharField(
        max_length=15,
        choices=Category.choices,
        blank=True,
        null=True,
        help_text='Predicted ticket category from the NLP classifier.',
    )
    ai_sentiment = models.CharField(
        max_length=10,
        choices=Sentiment.choices,
        blank=True,
        null=True,
        help_text='Predicted sentiment from the NLP sentiment analyser.',
    )
    ai_sentiment_score = models.FloatField(
        null=True,
        blank=True,
        help_text='Confidence score (0–1) of the sentiment prediction.',
    )
    ai_suggested_reply = models.TextField(
        blank=True,
        help_text='LLM-generated draft reply for the agent.',
    )
    ai_processed = models.BooleanField(
        default=False,
        help_text='Set to True once the Celery AI task has completed.',
    )

    # -----------------------------------------------------------------------
    # SLA / BI tracking fields
    # -----------------------------------------------------------------------
    first_response_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp of the first agent/admin message on this ticket.',
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when the ticket status changed to RESOLVED.',
    )

    # Standard timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['ai_category']),
            models.Index(fields=['ai_sentiment']),
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_to']),
        ]

    def __str__(self):
        return f'[{self.get_status_display()}] {self.title}'

    # -----------------------------------------------------------------------
    # Convenience properties
    # -----------------------------------------------------------------------
    @property
    def resolution_time_hours(self):
        """Return resolution time in hours, or None if unresolved."""
        if self.resolved_at and self.created_at:
            delta = self.resolved_at - self.created_at
            return round(delta.total_seconds() / 3600, 2)
        return None


class Message(models.Model):
    """A message (chat turn) within a ticket thread."""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    body = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text='Internal notes visible only to agents/admins.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message by {self.author.username} on Ticket #{self.ticket.id}'


class Tag(models.Model):
    """Free-form tags for grouping tickets."""

    name = models.CharField(max_length=50, unique=True)
    tickets = models.ManyToManyField(Ticket, related_name='tags', blank=True)

    def __str__(self):
        return self.name
