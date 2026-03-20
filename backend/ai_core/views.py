"""Views for the ai_core app — expose AI task status and manual triggers."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAgentOrAdmin


class AITaskStatusView(APIView):
    """
    GET /api/v1/ai/tasks/<task_id>/
    Check the status of a Celery AI task.
    """

    permission_classes = [IsAuthenticated, IsAgentOrAdmin]

    def get(self, request, task_id):
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        data = {
            'task_id': task_id,
            'status': result.status,
            'result': result.result if result.ready() else None,
        }
        return Response(data)


class AIReprocessView(APIView):
    """
    POST /api/v1/ai/reprocess/<ticket_id>/
    Manually re-trigger the AI pipeline for a specific ticket.
    """

    permission_classes = [IsAuthenticated, IsAgentOrAdmin]

    def post(self, request, ticket_id):
        from tickets.models import Ticket
        from .tasks import analyze_ticket

        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        task = analyze_ticket.delay(ticket.id)
        return Response({'task_id': task.id, 'status': 'queued'})
