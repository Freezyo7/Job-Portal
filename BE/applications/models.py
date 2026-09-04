from django.db import models
from django.conf import settings

# Create your models here.

class Application(models.Model):
    """A job the user confirmed they applied to.

    Rows are only created once the user comes back from the job page and
    confirms, so a row here always means a real application and the
    calendar is a straight count of rows per day.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    # String reference rather than importing Job, so the two apps stay
    # independent and there is no import cycle.
    #
    # SET_NULL, not CASCADE: jobs are perishable (scrapers prune stale
    # listings), applications are a permanent record. Losing the live link
    # must not take the Application row — and with it a day of the user's
    # streak — down with it.
    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )

    # A snapshot of the job's display fields, taken when the user applied.
    # Deliberately minimal — just what the applications list renders, no
    # description/skills — so the list stays fully readable (title, company,
    # logo, and the original link) even after the source Job row is gone.
    job_title = models.CharField(max_length=500, blank=True, default="")
    job_company = models.CharField(max_length=255, blank=True, default="")
    job_company_logo = models.URLField(max_length=2000, blank=True, default="")
    job_source = models.CharField(max_length=20, blank=True, default="")
    job_location = models.CharField(max_length=500, blank=True, default="")
    job_url = models.URLField(max_length=2000, blank=True, default="")
    job_apply_url = models.URLField(max_length=2000, blank=True, default="")

    # Optional recruiter / referral / contact person info
    contact_name = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_linkedin = models.URLField(max_length=500, blank=True, default="")

    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-applied_at"]
        constraints = [
            # Applying twice to the same job is the same application, not a
            # second one. Enforced here so a race between two requests
            # cannot create duplicates, which a view-level check alone
            # would allow.
            models.UniqueConstraint(
                fields=["user", "job"],
                name="unique_user_job_application",
            )
        ]
        indexes = [
            models.Index(fields=["user", "applied_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} -> {self.job}"