"""URL patterns for the ai_core app."""

from django.urls import path
from .views import AITaskStatusView, AIReprocessView

urlpatterns = [
    path('tasks/<str:task_id>/', AITaskStatusView.as_view(), name='ai-task-status'),
    path('reprocess/<int:ticket_id>/', AIReprocessView.as_view(), name='ai-reprocess'),
]
