"""
Celery application configuration for the HelpDesk CRM project.

Celery is used to run AI/ML inference tasks asynchronously so that
the Django HTTP response is never blocked by heavy model inference.
"""

import os
from celery import Celery

# Set the default Django settings module for Celery workers
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'helpdesk.settings')

app = Celery('helpdesk')

# Load Celery configuration from Django settings using the CELERY_ namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed Django apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Diagnostic task to verify Celery is running correctly."""
    print(f'Request: {self.request!r}')
