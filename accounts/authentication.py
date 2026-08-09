from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the JWT from an httpOnly cookie instead of the Authorization
    header.

    The cookie is unreadable to JavaScript, so an XSS bug can't exfiltrate
    the token the way it could from localStorage.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE)

        # Fall back to the Authorization header so curl, Postman, and the
        # DRF browsable API still work during development.
        if raw_token is None:
            return super().authenticate(request)

        # Raises AuthenticationFailed if expired, tampered with, or malformed.
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


