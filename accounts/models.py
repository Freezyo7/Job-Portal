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