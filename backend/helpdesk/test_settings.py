"""
Test settings — overrides production settings for unit testing.

Uses SQLite (in-memory) instead of PostgreSQL, and disables Redis/Celery.
"""

from .settings import *

# Use SQLite for fast in-memory tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Run Celery tasks synchronously in tests (no broker needed)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use local memory cache for Celery results
CELERY_RESULT_BACKEND = 'cache'
CELERY_CACHE_BACKEND = 'memory'

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable email sending
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use a dummy media root
MEDIA_ROOT = '/tmp/helpdesk_test_media'
