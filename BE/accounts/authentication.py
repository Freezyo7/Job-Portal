from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the JWT from an httpOnly cookie instead of the Authorization
    header.

    The cookie is unreadable to JavaScript, so an XSS bug can't exfiltrate
    the token the way it could from localStorage.
    """

    def authenticate(self, request):
        raw_token = (request.COOKIES.get(settings.AUTH_COOKIE) or "").strip()

        # Treat a missing OR empty cookie as "not logged in" and fall back to
        # the Authorization header (so curl/Postman/the browsable API work).
        if not raw_token:
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed):
            # If the cookie token is expired, tampered with, or invalid,
            # attempt header authentication if present, or return None (unauthenticated)
            # so public endpoints (login, register, verify) can be accessed.
            header_auth = super().authenticate(request)
            if header_auth is not None:
                return header_auth
            return None
