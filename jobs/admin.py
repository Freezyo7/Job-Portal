from django.contrib import admin

from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "location", "source", "is_active", "posted_at")
    list_filter = ("source", "is_active", "employment_type", "job_type")
    search_fields = ("title", "company", "location")
    ordering = ("-posted_at",)
    date_hierarchy = "posted_at"
    list_per_page = 50

    # Ours, not the source's — never hand-editable.
    readonly_fields = ("created_at", "updated_at")

    # Bulk-deactivate bad listings straight from the changelist.
    actions = ("mark_inactive",)

    @admin.action(description="Mark selected jobs as inactive")
    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} job(s) marked inactive.")
