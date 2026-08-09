from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


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
        # delete_cookie() leaves an empty-string cookie behind, and passing
        # that to get_validated_token() would 401 the request — which would
        # lock a logged-out user out of the login endpoint itself.
        if not raw_token:
            return super().authenticate(request)

        # Raises AuthenticationFailed if expired, tampered with, or malformed.
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


