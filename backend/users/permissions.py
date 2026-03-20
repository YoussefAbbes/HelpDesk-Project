"""Custom DRF permissions for role-based access control."""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with the ADMIN role."""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_admin_user
        )


class IsAgentOrAdmin(BasePermission):
    """Allow access to agents and admins."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('AGENT', 'ADMIN')
        )


class IsOwnerOrAgentOrAdmin(BasePermission):
    """
    Object-level permission:
    - Customers can only access their own objects.
    - Agents and admins can access all objects.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('AGENT', 'ADMIN'):
            return True
        # For tickets/messages the owner field is `created_by`
        owner = getattr(obj, 'created_by', None) or getattr(obj, 'author', None)
        return owner == request.user
