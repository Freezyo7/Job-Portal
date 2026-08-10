import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create your models here.

class User(AbstractUser):
    pass

class EmailVerificationCode(models.Model):
    CODE_LENGTH = 6
    LIFETIME = timedelta(minutes=15)
    MAX_ATTEMPTS=5

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="verification_codes"
    )
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    # Every code must expire, so this is required, not nullable.
    expires_at = models.DateTimeField()
    # Null until the code is consumed or superseded; the timestamp doubles
    # as a record of when that happened.
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        # Matches the ordering above so "newest code for this user" is a
        # straight index read.
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self) -> str:
        return f"code for {self.user.email} ({'used' if self.used_at else 'pending'})"

    @staticmethod
    def hash_code(raw_code: str) -> str:
        """Codes are only 6 digits, so a slow hash buys little here; the
        attempt limit is what makes guessing infeasible."""
        return hashlib.sha256(raw_code.encode()).hexdigest()

    @classmethod
    def issue(cls, user) -> str:
        """Invalidate any outstanding codes, then create and return a new
        one. The raw code is returned once and never stored."""
        cls.objects.filter(user=user, used_at__isnull=True).update(
            used_at=timezone.now()
        )
        raw_code = f"{secrets.randbelow(10 ** cls.CODE_LENGTH):0{cls.CODE_LENGTH}d}"
        cls.objects.create(
            user=user,
            code_hash=cls.hash_code(raw_code),
            expires_at=timezone.now() + cls.LIFETIME,
        )
        return raw_code


    @property
    def is_usable(self) -> bool:
        return (
            self.used_at is None
            and self.attempts < self.MAX_ATTEMPTS
            and timezone.now() < self.expires_at
        )

# ===================================PRofile=====================================
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Profile is the source of truth for display name; User.first_name /
    # last_name from AbstractUser stay unused. Optional so an empty profile
    # can be created the first time a user opens the page.
    first_name = models.CharField(max_length=60, blank=True)
    last_name = models.CharField(max_length=60, blank=True)

    designation = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    contact_email = models.EmailField(blank=True)

    country = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=80, blank=True)
    full_address = models.CharField(max_length=255, blank=True)

    dob = models.CharField(max_length=40, blank=True)
    gender = models.CharField(max_length=32, blank=True)

    summary = models.TextField(blank=True)
    linkedin = models.URLField(max_length=300, blank=True)
    github = models.URLField(max_length=300, blank=True)
    portfolio = models.URLField(max_length=300, blank=True)

    # A flat list with no attributes of its own — a JSON array beats a join
    # table here, and matches how Job.skills is already stored, which makes
    # skill-based matching a straight comparison later.
    skills = models.JSONField(default=list, blank=True)

    resume_file_name = models.CharField(max_length=255, blank=True)
    resume_parsed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

class Experience(models.Model):
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="experience"
    )
    title = models.CharField(max_length=150)
    company = models.CharField(max_length=150)
    employment_type = models.CharField(max_length=60, blank=True)
    # Free text to match the frontend's month/year inputs.
    start_date = models.CharField(max_length=40, blank=True)
    end_date = models.CharField(max_length=40, blank=True)
    current = models.BooleanField(default=False)

    class Meta:
        # Current roles first, then most recent.
        ordering = ["-current", "-start_date"]

    def __str__(self) -> str:
        return f"{self.title} at {self.company}"

class Education(models.Model):
    """One qualification a user holds."""

    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="education"
    )
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=150)
    field_of_study = models.CharField(max_length=150, blank=True)
    grade = models.CharField(max_length=40, blank=True)
    start_date = models.CharField(max_length=40, blank=True)
    end_date = models.CharField(max_length=40, blank=True)
    current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-current", "-start_date"]
        verbose_name_plural = "education"

    def __str__(self) -> str:
        return f"{self.degree} — {self.institution}"
