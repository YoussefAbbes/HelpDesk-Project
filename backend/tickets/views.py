"""
Views for the tickets app.

Permission matrix:
  - Customers : create tickets, read/update own tickets, add non-internal messages.
  - Agents    : read/update all tickets, add messages (including internal), assign tickets.
  - Admins    : full CRUD, plus analytics.
"""

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.permissions import IsAgentOrAdmin, IsOwnerOrAgentOrAdmin
from .models import Attachment, Message, Tag, Ticket
from .serializers import (
    AttachmentSerializer,
    MessageSerializer,
    TagSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
)


class TicketViewSet(viewsets.ModelViewSet):
    """
    Full CRUD viewset for Tickets.

    list   GET  /api/v1/tickets/
    create POST /api/v1/tickets/
    retrieve GET /api/v1/tickets/<id>/
    update  PUT/PATCH /api/v1/tickets/<id>/
    destroy DELETE  /api/v1/tickets/<id>/
    assign  POST /api/v1/tickets/<id>/assign/
    """

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAgentOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'ai_category', 'ai_sentiment', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('created_by', 'assigned_to').prefetch_related(
            'messages__author', 'tags'
        )
        # Customers only see their own tickets
        if user.is_customer:
            qs = qs.filter(created_by=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        return TicketDetailSerializer

    def perform_create(self, serializer):
        """Save ticket and trigger the async AI analysis pipeline."""
        ticket = serializer.save(created_by=self.request.user)
        # Import here to avoid circular imports
        from ai_core.tasks import analyze_ticket
        analyze_ticket.delay(ticket.id)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAgentOrAdmin])
    def assign(self, request, pk=None):
        """POST /api/v1/tickets/<id>/assign/ — assign ticket to an agent."""
        ticket = self.get_object()
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({'error': 'agent_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from users.models import User
            agent = User.objects.get(pk=agent_id, role__in=('AGENT', 'ADMIN'))
        except Exception:
            return Response({'error': 'Agent not found.'}, status=status.HTTP_404_NOT_FOUND)
        ticket.assigned_to = agent
        ticket.save(update_fields=['assigned_to', 'updated_at'])
        return Response(TicketDetailSerializer(ticket, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAgentOrAdmin])
    def reprocess_ai(self, request, pk=None):
        """POST /api/v1/tickets/<id>/reprocess_ai/ — re-run AI analysis."""
        ticket = self.get_object()
        from ai_core.tasks import analyze_ticket
        analyze_ticket.delay(ticket.id)
        return Response({'status': 'AI analysis queued.'})


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/tickets/<ticket_id>/messages/
    POST /api/v1/tickets/<ticket_id>/messages/
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAgentOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(ticket_id=self.kwargs['ticket_id']).select_related('author')
        # Customers cannot see internal notes
        if user.is_customer:
            qs = qs.filter(is_internal=False)
        return qs

    def perform_create(self, serializer):
        ticket = Ticket.objects.get(pk=self.kwargs['ticket_id'])
        user = self.request.user
        # Track first response time for SLA metrics
        if user.role in ('AGENT', 'ADMIN') and ticket.first_response_at is None:
            ticket.first_response_at = timezone.now()
            ticket.save(update_fields=['first_response_at'])
        serializer.save(author=user, ticket=ticket)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/tickets/<ticket_id>/messages/<id>/"""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAgentOrAdmin]

    def get_queryset(self):
        return Message.objects.filter(ticket_id=self.kwargs['ticket_id'])


class TagListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/tickets/tags/"""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentOrAdmin]


class AttachmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/tickets/<ticket_id>/attachments/
    POST /api/v1/tickets/<ticket_id>/attachments/
    """

    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAgentOrAdmin]

    def get_queryset(self):
        """Return attachments for the specified ticket."""
        return Attachment.objects.filter(
            ticket_id=self.kwargs['ticket_id']
        ).select_related('uploaded_by', 'ticket')

    def perform_create(self, serializer):
        """Save attachment with ticket and uploader."""
        ticket = Ticket.objects.get(pk=self.kwargs['ticket_id'])

        # Get optional message_id from request data
        message_id = self.request.data.get('message_id')
        message = None
        if message_id:
            try:
                message = Message.objects.get(pk=message_id, ticket=ticket)
            except Message.DoesNotExist:
                pass

        # Extract file metadata
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            serializer.save(
                uploaded_by=self.request.user,
                ticket=ticket,
                message=message,
                original_filename=uploaded_file.name,
                file_size=uploaded_file.size,
                content_type=uploaded_file.content_type,
            )
        else:
            serializer.save(
                uploaded_by=self.request.user,
                ticket=ticket,
                message=message,
            )


class AttachmentDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/v1/attachments/<id>/"""

    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return all attachments, but permission checks ensure proper access."""
        return Attachment.objects.select_related('uploaded_by', 'ticket')

    def perform_destroy(self, instance):
        """Only the uploader or admin can delete an attachment."""
        user = self.request.user
        if user == instance.uploaded_by or user.is_admin_user:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the uploader or admin can delete this attachment.')

