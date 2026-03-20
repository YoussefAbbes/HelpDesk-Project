"""Admin configuration for the tickets app."""

from django.contrib import admin
from .models import Message, Tag, Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'status', 'priority', 'ai_category',
        'ai_sentiment', 'ai_processed', 'created_by', 'assigned_to', 'created_at',
    ]
    list_filter = ['status', 'priority', 'ai_category', 'ai_sentiment', 'ai_processed']
    search_fields = ['title', 'description', 'created_by__username']
    readonly_fields = ['ai_category', 'ai_sentiment', 'ai_sentiment_score', 'ai_suggested_reply', 'ai_processed']
    raw_id_fields = ['created_by', 'assigned_to']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'author', 'is_internal', 'created_at']
    list_filter = ['is_internal']
    search_fields = ['body', 'author__username']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
