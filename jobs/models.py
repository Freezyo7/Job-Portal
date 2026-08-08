from django.db import models


class Job(models.Model):
    """A job listing normalized across every scraper source."""

    class Source(models.TextChoices):
        NAUKRI = "naukri", "Naukri"
        FOUNDIT = "foundit", "Foundit"
        HIRIST = "hirist", "Hirist"
        UNSTOP = "unstop", "Unstop"
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
    # Where you actually apply — often an external site on aggregated posts.
    apply_url = models.URLField(max_length=500, blank=True)

    # Company presentation. Roughly 1 in 5 listings has no logo, so any UI
    # needs a placeholder fallback.
    company_logo = models.URLField(max_length=500, blank=True)
    company_id = models.CharField(max_length=32, blank=True)

    # Classification — useful as filters and as card badges.
    industry = models.CharField(max_length=120, blank=True)
    function = models.CharField(max_length=120, blank=True)
    job_type = models.CharField(max_length=60, blank=True)      # Permanent Job
    employment_type = models.CharField(max_length=60, blank=True)  # Full time

    # Experience (years)
    min_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    max_experience = models.PositiveSmallIntegerField(null=True, blank=True)

    # Salary (annual, in `currency`). Null when the employer hides it.
    min_salary = models.PositiveIntegerField(null=True, blank=True)
    max_salary = models.PositiveIntegerField(null=True, blank=True)
    currency = models.CharField(max_length=8, blank=True)

    # Content. `description` is sanitized HTML (tag allowlist, no
    # attributes) so it is safe to render; `description_text` is the same
    # content flattened for card previews and search.
    description = models.TextField(blank=True)
    description_text = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)

    # Set false when the source reports the listing closed, so stale rows
    # can be filtered out without deleting the history.
    is_active = models.BooleanField(default=True)
    applicant_count = models.PositiveIntegerField(null=True, blank=True)

    # Timestamps — posted_at comes from the source, the others are ours.
    posted_at = models.DateTimeField(null=True, blank=True)
    # When the source says the listing closes.
    expires_at = models.DateTimeField(null=True, blank=True)
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
