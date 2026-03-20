"""
Tests for the HelpDesk CRM backend.

These tests use pytest-django and cover:
  - User model & registration
  - Ticket CRUD + role-based access
  - AI task mocking
  - Analytics endpoints
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        username='customer1',
        password='testpass123',
        email='customer1@example.com',
        role='CUSTOMER',
    )


@pytest.fixture
def agent(db):
    return User.objects.create_user(
        username='agent1',
        password='testpass123',
        email='agent1@example.com',
        role='AGENT',
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='admin1',
        password='testpass123',
        email='admin1@example.com',
        role='ADMIN',
        is_staff=True,
    )


# Each role gets its own isolated APIClient to prevent shared-state issues
@pytest.fixture
def auth_customer(db):
    client = APIClient()
    user = User.objects.create_user(
        username='customer1', password='testpass123',
        email='customer1@example.com', role='CUSTOMER',
    )
    client.force_authenticate(user=user)
    client._user = user
    return client


@pytest.fixture
def auth_agent(db):
    client = APIClient()
    user = User.objects.create_user(
        username='agent1', password='testpass123',
        email='agent1@example.com', role='AGENT',
    )
    client.force_authenticate(user=user)
    client._user = user
    return client


@pytest.fixture
def auth_admin(db):
    client = APIClient()
    user = User.objects.create_user(
        username='admin1', password='testpass123',
        email='admin1@example.com', role='ADMIN', is_staff=True,
    )
    client.force_authenticate(user=user)
    client._user = user
    return client


# ---------------------------------------------------------------------------
# User model tests
# ---------------------------------------------------------------------------

class TestUserModel:
    def test_user_role_properties(self, db):
        customer = User(username='c', role='CUSTOMER')
        agent = User(username='a', role='AGENT')
        admin = User(username='ad', role='ADMIN')

        assert customer.is_customer is True
        assert customer.is_agent is False
        assert agent.is_agent is True
        assert admin.is_admin_user is True

    def test_user_str(self, auth_customer):
        assert 'customer1' in str(auth_customer._user)
        assert 'Customer' in str(auth_customer._user)


# ---------------------------------------------------------------------------
# Auth / Registration tests
# ---------------------------------------------------------------------------

class TestRegistration:
    def test_register_customer(self, db, api_client):
        url = reverse('user-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'password2': 'securepass123',
            'role': 'CUSTOMER',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser').exists()

    def test_register_password_mismatch(self, db, api_client):
        url = reverse('user-register')
        data = {
            'username': 'newuser2',
            'email': 'newuser2@example.com',
            'password': 'securepass123',
            'password2': 'differentpass',
            'role': 'CUSTOMER',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_me_endpoint(self, auth_customer):
        url = reverse('user-me')
        response = auth_customer.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == auth_customer._user.username
        assert response.data['role'] == 'CUSTOMER'

    def test_me_requires_auth(self, api_client):
        url = reverse('user-me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Ticket tests
# ---------------------------------------------------------------------------

class TestTickets:
    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_can_create_ticket(self, mock_task, auth_customer):
        url = reverse('ticket-list')
        data = {
            'title': 'My billing issue',
            'description': 'I was charged twice this month.',
            'priority': 'HIGH',
        }
        response = auth_customer.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'My billing issue'
        assert response.data['ai_processed'] is False
        # Verify AI task was triggered
        mock_task.assert_called_once_with(response.data['id'])

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_only_sees_own_tickets(self, mock_task, auth_customer, db):
        from tickets.models import Ticket
        other_customer = User.objects.create_user(
            username='other', password='pass123', role='CUSTOMER'
        )
        # Create ticket for current customer
        Ticket.objects.create(
            title='My ticket', description='desc', created_by=auth_customer._user
        )
        # Create ticket for other customer
        Ticket.objects.create(
            title='Other ticket', description='desc', created_by=other_customer
        )
        url = reverse('ticket-list')
        response = auth_customer.get(url)
        assert response.status_code == status.HTTP_200_OK
        titles = [t['title'] for t in response.data['results']]
        assert 'My ticket' in titles
        assert 'Other ticket' not in titles

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_agent_can_see_all_tickets(self, mock_task, auth_agent, auth_customer, db):
        from tickets.models import Ticket
        Ticket.objects.create(title='T1', description='d', created_by=auth_customer._user)
        url = reverse('ticket-list')
        response = auth_agent.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_unauthenticated_cannot_access_tickets(self, mock_task, api_client):
        url = reverse('ticket-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_cannot_delete_others_ticket(self, mock_task, auth_customer, db):
        from tickets.models import Ticket
        other = User.objects.create_user(
            username='other2', password='pass123', role='CUSTOMER'
        )
        ticket = Ticket.objects.create(title='T', description='d', created_by=other)
        url = reverse('ticket-detail', kwargs={'pk': ticket.pk})
        response = auth_customer.delete(url)
        # Should get 403 or 404 (object-level permission)
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Message tests
# ---------------------------------------------------------------------------

class TestMessages:
    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_can_add_message(self, mock_task, auth_customer, db):
        from tickets.models import Ticket
        ticket = Ticket.objects.create(
            title='T', description='d', created_by=auth_customer._user
        )
        url = reverse('message-list-create', kwargs={'ticket_id': ticket.pk})
        response = auth_customer.post(url, {'body': 'Hello!'}, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_cannot_post_internal_note(self, mock_task, auth_customer, db):
        from tickets.models import Ticket
        ticket = Ticket.objects.create(
            title='T', description='d', created_by=auth_customer._user
        )
        url = reverse('message-list-create', kwargs={'ticket_id': ticket.pk})
        response = auth_customer.post(
            url, {'body': 'Internal note', 'is_internal': True}, format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_customer_cannot_see_internal_messages(self, mock_task, auth_customer, auth_agent, db):
        from tickets.models import Ticket, Message
        ticket = Ticket.objects.create(
            title='T', description='d', created_by=auth_customer._user
        )
        Message.objects.create(
            ticket=ticket, author=auth_agent._user, body='Internal note', is_internal=True
        )
        Message.objects.create(
            ticket=ticket, author=auth_agent._user, body='Public reply', is_internal=False
        )
        url = reverse('message-list-create', kwargs={'ticket_id': ticket.pk})
        response = auth_customer.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Response is paginated — results are under 'results' key
        results = response.data.get('results', response.data)
        bodies = [m['body'] for m in results]
        assert 'Internal note' not in bodies
        assert 'Public reply' in bodies


# ---------------------------------------------------------------------------
# AI Task tests
# ---------------------------------------------------------------------------

class TestAITasks:
    def test_analyze_ticket_task_updates_fields(self, auth_customer):
        from tickets.models import Ticket
        from ai_core.tasks import (
            _predict_sentiment, _predict_category, _generate_suggested_reply
        )

        ticket = Ticket.objects.create(
            title='Billing problem',
            description='I was charged twice.',
            created_by=auth_customer._user,
        )

        # Test inference helpers with mocked pipelines
        with patch('ai_core.tasks._get_sentiment_pipeline') as mock_sent:
            mock_pipe = MagicMock()
            mock_pipe.return_value = [{'label': 'negative', 'score': 0.92}]
            mock_sent.return_value = mock_pipe
            label, score = _predict_sentiment('I was charged twice.')
            assert label == 'NEGATIVE'
            assert 0 <= score <= 1

        with patch('ai_core.tasks._get_category_pipeline') as mock_cat:
            mock_pipe = MagicMock()
            mock_pipe.return_value = {
                'labels': ['Billing', 'Technical Support'],
                'scores': [0.85, 0.10],
            }
            mock_cat.return_value = mock_pipe
            category = _predict_category('I was charged twice.')
            assert category == 'BILLING'

    def test_analyze_ticket_full_task(self, auth_customer):
        from tickets.models import Ticket
        from ai_core.tasks import analyze_ticket

        ticket = Ticket.objects.create(
            title='Login broken',
            description='I cannot log in to my account.',
            created_by=auth_customer._user,
        )

        with patch('ai_core.tasks._get_sentiment_pipeline') as mock_s, \
             patch('ai_core.tasks._get_category_pipeline') as mock_c, \
             patch('ai_core.tasks._get_reply_pipeline') as mock_r:

            mock_s.return_value = MagicMock(
                return_value=[{'label': 'negative', 'score': 0.88}]
            )
            mock_c.return_value = MagicMock(
                return_value={'labels': ['Technical Support'], 'scores': [0.9]}
            )
            mock_r.return_value = MagicMock(
                return_value=[{'generated_text': 'Thank you for contacting us.'}]
            )

            result = analyze_ticket(ticket.id)

        assert result['ai_sentiment'] == 'NEGATIVE'
        assert result['ai_category'] == 'TECH_SUPPORT'

        ticket.refresh_from_db()
        assert ticket.ai_processed is True
        assert ticket.ai_sentiment == 'NEGATIVE'
        assert ticket.ai_category == 'TECH_SUPPORT'
        assert 'Thank you' in ticket.ai_suggested_reply


# ---------------------------------------------------------------------------
# Analytics tests
# ---------------------------------------------------------------------------

class TestAnalytics:
    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_overview_requires_admin(self, mock_task, auth_customer, auth_agent, auth_admin, db):
        url = reverse('analytics-overview')
        # Use fresh separate client instances for each role
        from rest_framework.test import APIClient
        customer_client = APIClient()
        customer_client.force_authenticate(user=auth_customer._user)
        agent_client = APIClient()
        agent_client.force_authenticate(user=auth_agent._user)
        admin_client = APIClient()
        admin_client.force_authenticate(user=auth_admin._user)

        assert customer_client.get(url).status_code == status.HTTP_403_FORBIDDEN
        assert agent_client.get(url).status_code == status.HTTP_403_FORBIDDEN
        assert admin_client.get(url).status_code == status.HTTP_200_OK

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_overview_returns_expected_keys(self, mock_task, auth_admin, db):
        url = reverse('analytics-overview')
        response = auth_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        for key in ('total_tickets', 'open_tickets', 'avg_resolution_hours', 'active_agents'):
            assert key in response.data

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_ticket_trends(self, mock_task, auth_admin, auth_customer, db):
        from tickets.models import Ticket
        Ticket.objects.create(title='T1', description='d', created_by=auth_customer._user)
        url = reverse('analytics-ticket-trends')
        response = auth_admin.get(url, {'days': 7})
        assert response.status_code == status.HTTP_200_OK
        assert 'data' in response.data

    @patch('ai_core.tasks.analyze_ticket.delay')
    def test_sentiment_distribution(self, mock_task, auth_admin, db):
        url = reverse('analytics-sentiment')
        response = auth_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'overall' in response.data
        assert 'by_category' in response.data
