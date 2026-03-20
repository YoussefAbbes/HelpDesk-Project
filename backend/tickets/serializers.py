"""Serializers for the tickets app."""

from django.utils import timezone
from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Attachment, Message, Tag, Ticket


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializes file attachments for tickets and messages."""

    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = [
            'id', 'ticket', 'message', 'uploaded_by',
            'file', 'file_url', 'original_filename',
            'file_size', 'content_type', 'created_at',
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'file_size',
            'original_filename', 'content_type', 'created_at',
        ]

    def get_file_url(self, obj):
        """Return the full URL to the file."""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MessageSerializer(serializers.ModelSerializer):
    """Serializes a single message within a ticket thread."""

    author = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'ticket', 'author', 'body', 'is_internal',
            'created_at', 'updated_at',
        ]
        # ticket is set programmatically in perform_create, not by the client
        read_only_fields = ['id', 'ticket', 'author', 'created_at', 'updated_at']

    def validate_is_internal(self, value):
        """Only agents/admins may post internal notes."""
        request = self.context.get('request')
        if value and request and request.user.role == 'CUSTOMER':
            raise serializers.ValidationError(
                'Customers cannot post internal notes.'
            )
        return value


class TicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ticket list views."""

    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'status', 'priority',
            'ai_category', 'ai_sentiment', 'ai_sentiment_score',
            'ai_processed',
            'created_by', 'assigned_to', 'tags',
            'message_count', 'created_at', 'updated_at',
        ]

    def get_message_count(self, obj):
        return obj.messages.count()


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full serializer for ticket detail/create/update views."""

    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='tags',
    )
    resolution_time_hours = serializers.ReadOnlyField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'ai_category', 'ai_sentiment', 'ai_sentiment_score',
            'ai_suggested_reply', 'ai_processed',
            'created_by', 'assigned_to',
            'tags', 'tag_ids',
            'messages', 'attachments',
            'first_response_at', 'resolved_at', 'resolution_time_hours',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'ai_category', 'ai_sentiment',
            'ai_sentiment_score', 'ai_suggested_reply', 'ai_processed',
            'first_response_at', 'resolved_at', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        ticket = Ticket.objects.create(**validated_data)
        ticket.tags.set(tags)
        return ticket

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        # Track resolved_at timestamp
        new_status = validated_data.get('status')
        if new_status == Ticket.Status.RESOLVED and instance.status != Ticket.Status.RESOLVED:
            validated_data['resolved_at'] = timezone.now()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags is not None:
            instance.tags.set(tags)
        return instance
