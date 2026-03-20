"""
Custom User model with role-based access control.

Roles:
  CUSTOMER — end users who submit support tickets.
  AGENT    — support staff who resolve tickets.
  ADMIN    — managers who access BI dashboards and system settings.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user model adding role, avatar, and department fields."""

    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        AGENT = 'AGENT', 'Agent'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
    )
    department = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)

    # Timestamps managed by AbstractUser (date_joined, last_login)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    # -----------------------------------------------------------------------
    # Role helpers
    # -----------------------------------------------------------------------
    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_agent(self):
        return self.role == self.Role.AGENT

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN
