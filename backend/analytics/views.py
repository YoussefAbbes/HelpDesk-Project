"""
Business Intelligence analytics views.

Uses Django ORM aggregations to compute key metrics without
loading every row into Python — letting the database do the work.

Available endpoints:
  GET /api/v1/analytics/overview/       — top-level KPIs
  GET /api/v1/analytics/ticket-trends/  — daily ticket volume (last N days)
  GET /api/v1/analytics/sentiment/      — sentiment distribution
  GET /api/v1/analytics/resolution/     — avg resolution time by category
  GET /api/v1/analytics/agents/         — per-agent workload & resolution stats
"""

import logging
from datetime import timedelta

from django.db.models import Avg, Case, Count, DurationField, ExpressionWrapper, F, Q, When
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tickets.models import Ticket
from users.models import User
from users.permissions import IsAdmin

logger = logging.getLogger(__name__)


class OverviewView(APIView):
    """
    GET /api/v1/analytics/overview/
    Returns top-level KPI counters for the admin dashboard.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)

        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status__in=('OPEN', 'IN_PROGRESS')).count()
        resolved_this_week = Ticket.objects.filter(
            status='RESOLVED', resolved_at__gte=last_7_days
        ).count()
        new_this_month = Ticket.objects.filter(created_at__gte=last_30_days).count()

        # Average resolution time in hours (only resolved tickets)
        avg_resolution = Ticket.objects.filter(
            status='RESOLVED',
            resolved_at__isnull=False,
        ).annotate(
            duration=ExpressionWrapper(
                F('resolved_at') - F('created_at'),
                output_field=DurationField(),
            )
        ).aggregate(avg=Avg('duration'))['avg']

        avg_resolution_hours = None
        if avg_resolution:
            avg_resolution_hours = round(avg_resolution.total_seconds() / 3600, 2)

        # Total active agents
        active_agents = User.objects.filter(role='AGENT', is_active=True).count()

        # Customer satisfaction proxy: % of tickets with POSITIVE sentiment
        ai_processed = Ticket.objects.filter(ai_processed=True)
        total_ai = ai_processed.count()
        positive_pct = None
        if total_ai > 0:
            positive_count = ai_processed.filter(ai_sentiment='POSITIVE').count()
            positive_pct = round(positive_count / total_ai * 100, 1)

        return Response({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'resolved_this_week': resolved_this_week,
            'new_this_month': new_this_month,
            'avg_resolution_hours': avg_resolution_hours,
            'active_agents': active_agents,
            'positive_sentiment_pct': positive_pct,
        })


class TicketTrendsView(APIView):
    """
    GET /api/v1/analytics/ticket-trends/?days=30&group_by=day
    Returns ticket creation volume grouped by day/week/month.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        group_by = request.query_params.get('group_by', 'day')

        since = timezone.now() - timedelta(days=days)

        trunc_fn_map = {
            'day': TruncDay,
            'week': TruncWeek,
            'month': TruncMonth,
        }
        trunc_fn = trunc_fn_map.get(group_by, TruncDay)

        data = (
            Ticket.objects.filter(created_at__gte=since)
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(
                count=Count('id'),
                resolved=Count('id', filter=Q(status='RESOLVED')),
            )
            .order_by('period')
        )

        return Response({
            'group_by': group_by,
            'days': days,
            'data': [
                {
                    'period': item['period'].date().isoformat() if item['period'] else None,
                    'count': item['count'],
                    'resolved': item['resolved'],
                }
                for item in data
            ],
        })


class SentimentDistributionView(APIView):
    """
    GET /api/v1/analytics/sentiment/
    Returns the distribution of AI-predicted sentiment values.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        data = (
            Ticket.objects.filter(ai_processed=True)
            .values('ai_sentiment')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Also get a breakdown per category
        category_sentiment = (
            Ticket.objects.filter(ai_processed=True, ai_category__isnull=False)
            .values('ai_category', 'ai_sentiment')
            .annotate(count=Count('id'))
            .order_by('ai_category', 'ai_sentiment')
        )

        return Response({
            'overall': list(data),
            'by_category': list(category_sentiment),
        })


class ResolutionTimeView(APIView):
    """
    GET /api/v1/analytics/resolution/
    Returns average resolution time (hours) broken down by category and priority.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        base_qs = Ticket.objects.filter(
            status='RESOLVED',
            resolved_at__isnull=False,
        ).annotate(
            duration=ExpressionWrapper(
                F('resolved_at') - F('created_at'),
                output_field=DurationField(),
            )
        )

        by_category = (
            base_qs.values('ai_category')
            .annotate(avg_hours=Avg('duration'), ticket_count=Count('id'))
            .order_by('ai_category')
        )

        by_priority = (
            base_qs.values('priority')
            .annotate(avg_hours=Avg('duration'), ticket_count=Count('id'))
            .order_by('priority')
        )

        def format_hours(qs_result):
            return [
                {
                    **item,
                    'avg_hours': (
                        round(item['avg_hours'].total_seconds() / 3600, 2)
                        if item['avg_hours'] else None
                    ),
                }
                for item in qs_result
            ]

        return Response({
            'by_category': format_hours(by_category),
            'by_priority': format_hours(by_priority),
        })


class AgentPerformanceView(APIView):
    """
    GET /api/v1/analytics/agents/
    Returns per-agent ticket assignment counts and average resolution times.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        data = (
            User.objects.filter(role__in=('AGENT', 'ADMIN'), is_active=True)
            .annotate(
                total_assigned=Count('assigned_tickets'),
                open_count=Count(
                    'assigned_tickets',
                    filter=Q(assigned_tickets__status__in=('OPEN', 'IN_PROGRESS')),
                ),
                resolved_count=Count(
                    'assigned_tickets',
                    filter=Q(assigned_tickets__status='RESOLVED'),
                ),
                avg_resolution=Avg(
                    ExpressionWrapper(
                        F('assigned_tickets__resolved_at') - F('assigned_tickets__created_at'),
                        output_field=DurationField(),
                    ),
                    filter=Q(assigned_tickets__status='RESOLVED'),
                ),
            )
            .values(
                'id', 'username', 'first_name', 'last_name',
                'total_assigned', 'open_count', 'resolved_count', 'avg_resolution',
            )
            .order_by('-resolved_count')
        )

        result = []
        for item in data:
            avg = item.pop('avg_resolution')
            result.append({
                **item,
                'avg_resolution_hours': (
                    round(avg.total_seconds() / 3600, 2) if avg else None
                ),
            })

        return Response({'agents': result})
