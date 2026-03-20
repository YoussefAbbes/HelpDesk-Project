"""URL patterns for the analytics app."""

from django.urls import path
from .views import (
    AgentPerformanceView,
    OverviewView,
    ResolutionTimeView,
    SentimentDistributionView,
    TicketTrendsView,
)

urlpatterns = [
    path('overview/', OverviewView.as_view(), name='analytics-overview'),
    path('ticket-trends/', TicketTrendsView.as_view(), name='analytics-ticket-trends'),
    path('sentiment/', SentimentDistributionView.as_view(), name='analytics-sentiment'),
    path('resolution/', ResolutionTimeView.as_view(), name='analytics-resolution'),
    path('agents/', AgentPerformanceView.as_view(), name='analytics-agents'),
]
