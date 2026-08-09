from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailVerificationCode, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "is_active", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email")
    ordering = ("-date_joined",)


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "expires_at", "used_at", "attempts")
    list_filter = ("created_at",)
    search_fields = ("user__email", "user__username")
    # Codes are issued by the system; hand-editing them would only ever be
    # a way to bypass verification.
    readonly_fields = ("user", "code_hash", "created_at", "expires_at", "used_at", "attempts")
