import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.throttling import ScopedRateThrottle

from .emails import send_verification_code
from .models import EmailVerificationCode
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    UserSerializer,
)

User = get_user_model()


def set_auth_cookies(response, user):
    """Attach access + refresh JWTs as httpOnly cookies."""
    refresh = RefreshToken.for_user(user)
    common = {
        "httponly": True,  # unreadable by JavaScript
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
    }
    response.set_cookie(
        settings.AUTH_COOKIE,
        str(refresh.access_token),
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        **common,
    )
    response.set_cookie(
        settings.AUTH_COOKIE_REFRESH,
        str(refresh),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        **common,
    )
    return response


class RegisterView(APIView):
    """POST /api/auth/register/ — create an unverified account."""

    permission_classes = [AllowAny]  # chicken-and-egg exception
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": first_error(serializer), "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        user.is_active = False
        user.save(update_fields=["is_active"])

        send_verification_code(user)

        return Response(
            {
                "message": "Account created successfully. Please check your email for the verification code.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """POST /api/auth/verify/ — exchange a code for a verified, logged-in session."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verify"

    def post(self, request):
        email = str(request.data.get("email", "")).lower().strip()
        code = str(request.data.get("code", "")).strip()
        if not email or not code:
            return Response(
                {"message": "Email and code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalid = Response(
            {"message": "Invalid or expired code"},
            status=status.HTTP_400_BAD_REQUEST,
        )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return invalid

        record = user.verification_codes.first()
        if record is None or not record.is_usable:
            return invalid

        # Count the attempt before comparing, so failures always cost one.
        record.attempts += 1
        record.save(update_fields=["attempts"])

        if record.code_hash != EmailVerificationCode.hash_code(code):
            return invalid

        record.used_at = timezone.now()
        record.save(update_fields=["used_at"])
        user.is_active = True
        user.save(update_fields=["is_active"])

        response = Response(
            {"message": "Email verified", "user": UserSerializer(user).data}
        )
        return set_auth_cookies(response, user)


class ResendVerificationView(APIView):
    """POST /api/auth/resend/ — email a fresh code."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "resend"

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        user = User.objects.filter(email__iexact=email, is_active=False).first()
        if user is not None:
            send_verification_code(user)

        # Identical response either way, so this can't be used to discover
        # which addresses are registered.
        return Response(
            {"message": "If that account exists, a new code has been sent."}
        )


class LoginView(APIView):
    """POST /api/auth/login/ — exchange credentials for auth cookies."""

    permission_classes = [AllowAny]  # chicken-and-egg exception
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": first_error(serializer)},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data["user"]
        response = Response(
            {"message": "Logged in successfully", "user": UserSerializer(user).data}
        )
        return set_auth_cookies(response, user)


def _unique_username(email: str) -> str:
    """Derive a username from an email's local part for a Google sign-up.

    AbstractUser's default validator only allows letters/digits/@/./+/-/_,
    so anything else in the local part (rare, but legal in an email address)
    is stripped rather than rejected.
    """
    base = re.sub(r"[^\w.@+-]", "", email.split("@", 1)[0]) or "user"
    username = base
    suffix = 1
    while User.objects.filter(username__iexact=username).exists():
        suffix += 1
        username = f"{base}{suffix}"
    return username


class GoogleAuthView(APIView):
    """POST /api/auth/google/ — exchange a Google ID token for auth cookies.

    Accepts the `credential` Google Identity Services hands back to the
    frontend, verifies it was actually issued by Google for our client ID,
    then signs the matching (or newly created) user in exactly like
    LoginView does.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"message": "Google sign-in is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        credential = request.data.get("credential")
        if not credential:
            return Response(
                {"message": "Missing Google credential"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response(
                {"message": "Invalid or expired Google credential"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not payload.get("email_verified"):
            return Response(
                {"message": "Google account email is not verified"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = payload["email"].lower().strip()
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User.objects.create_user(
                username=_unique_username(email),
                email=email,
                first_name=payload.get("given_name", ""),
                last_name=payload.get("family_name", ""),
            )
        elif not user.is_active:
            # A prior email/password signup that never verified — Google
            # already vouches for the address, so unblock it here.
            user.is_active = True
            user.save(update_fields=["is_active"])

        response = Response(
            {"message": "Logged in successfully", "user": UserSerializer(user).data}
        )
        return set_auth_cookies(response, user)


class LogoutView(APIView):
    """POST /api/auth/logout/ — clear the auth cookies."""

    permission_classes = [AllowAny]

    def post(self, request):
        raw = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass
        response = Response({"message": "Logged out successfully"})
        cookie_attrs = {
            "path": "/",
            "secure": settings.AUTH_COOKIE_SECURE,
            "samesite": settings.AUTH_COOKIE_SAMESITE,
        }
        response.delete_cookie(settings.AUTH_COOKIE, **cookie_attrs)

        response.delete_cookie(settings.AUTH_COOKIE_REFRESH, **cookie_attrs)
        return response


class MeView(APIView):
    """GET /api/auth/me/ — the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


def first_error(serializer) -> str:
    """Flatten DRF's {field: [msgs]} into the single string the React app
    reads from `err.response.data.message`."""
    for messages in serializer.errors.values():
        if isinstance(messages, list) and messages:
            return str(messages[0])
    return "Invalid input"


class RefreshView(APIView):
    """POST /api/auth/refresh/ — mint a new access token from the refresh cookie."""

    permission_classes = [AllowAny]  # the access token is expired by definition

    def post(self, request):
        raw = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw:
            return Response(
                {"message": "No refresh token"}, status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(raw)
            user = User.objects.get(id=refresh["user_id"], is_active=True)
            refresh.blacklist()
        except (TokenError, User.DoesNotExist, KeyError):
            response = Response(
                {"message": "Session expired, please log in again"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            cookie_attrs = {
                "path": "/",
                "secure": settings.AUTH_COOKIE_SECURE,
                "samesite": settings.AUTH_COOKIE_SAMESITE,
            }
            response.delete_cookie(settings.AUTH_COOKIE, **cookie_attrs)
            response.delete_cookie(settings.AUTH_COOKIE_REFRESH, **cookie_attrs)
            return response

        response = Response({"message": "Token refreshed"})
        return set_auth_cookies(response, user)
