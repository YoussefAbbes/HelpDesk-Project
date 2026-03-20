"""
Makes `helpdesk` a Python package and initialises Celery when Django starts.
This ensures that the shared_task decorator works correctly.
"""

from .celery import app as celery_app

__all__ = ('celery_app',)
