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
    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.CASCADE,
        related_name="applications",
    )

    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-applied_at"]
        constraints = [
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