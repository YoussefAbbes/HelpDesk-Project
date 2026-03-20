"""URL patterns for the tickets app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttachmentDetailView,
    AttachmentListCreateView,
    MessageDetailView,
    MessageListCreateView,
    TagListCreateView,
    TicketViewSet,
)

router = DefaultRouter()
router.register(r'', TicketViewSet, basename='ticket')

urlpatterns = [
    # Tag endpoints
    path('tags/', TagListCreateView.as_view(), name='tag-list-create'),

    # Attachment endpoints — nested under a ticket or standalone detail
    path('<int:ticket_id>/attachments/', AttachmentListCreateView.as_view(), name='attachment-list-create'),
    path('attachments/<int:pk>/', AttachmentDetailView.as_view(), name='attachment-detail'),

    # Message endpoints — nested under a ticket
    path('<int:ticket_id>/messages/', MessageListCreateView.as_view(), name='message-list-create'),
    path('<int:ticket_id>/messages/<int:pk>/', MessageDetailView.as_view(), name='message-detail'),

    # Ticket CRUD (must come after more-specific paths)
    path('', include(router.urls)),
]
