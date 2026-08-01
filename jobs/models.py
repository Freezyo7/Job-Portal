from django.db import models


class Job(models.Model):
    """A job listing normalized across every scraper source."""

    class Source(models.TextChoices):
        NAUKRI = "naukri", "Naukri"
        INDEED = "indeed", "Indeed"
        LINKEDIN = "linkedin", "LinkedIn"

    # Identity — source + source_job_id is what makes a listing unique.
    source = models.CharField(max_length=20, choices=Source.choices)
    source_job_id = models.CharField(max_length=64)

    # Core
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    url = models.URLField(max_length=500)

    # Experience (years)
    min_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    max_experience = models.PositiveSmallIntegerField(null=True, blank=True)

    # Salary (annual, in `currency`). Null when the employer hides it.
    min_salary = models.PositiveIntegerField(null=True, blank=True)
    max_salary = models.PositiveIntegerField(null=True, blank=True)
    currency = models.CharField(max_length=8, blank=True)

    # Content
    description = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)

    # Timestamps — posted_at comes from the source, the others are ours.
    posted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_job_id"],
                name="unique_job_per_source",
            )
        ]
        indexes = [
            models.Index(fields=["source", "-posted_at"]),
            models.Index(fields=["-created_at"]),
        ]
        ordering = ["-posted_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title} @ {self.company} ({self.source})"
