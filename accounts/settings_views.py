from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


from .emails import send_verification_code
from .settings_serializers import (
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    SettingsSerializer,
    UpdateAccountSerializer,
)
from .views import first_error, set_auth_cookies

User = get_user_model()

class SettingsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = SettingsSerializer(request.user)
        return Response(serializer.data)

class UpdateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        serializer = UpdateAccountSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(
                {"message": first_error(serializer), "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        new_email = serializer.validated_data.get("email")
        new_username = serializer.validated_data.get("username")

        if new_username:
            user.username = new_username

        if new_email and new_email.lower() != user.email.lower():
            user.email = new_email
            user.is_active = False
            user.save()
            send_verification_code(user)

            response = Response(
                {
                    "message": "Email updated. Please verify your new email address.",
                    "email_changed": True,
                }
            )
            response.delete_cookie(settings.AUTH_COOKIE)
            response.delete_cookie(settings.AUTH_COOKIE_REFRESH)
            return response
        
        user.save()
        return Response(
            {
                "message": "Account updated successfully",
                "user": SettingsSerializer(user).data, 
            }
        )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request":request}
        )
        if not serializer.is_valid():
            return Response(
                {"message": first_error(serializer), "errors":serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user= request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        response = Response({"message": "Password changed successfully"})
        return set_auth_cookies(response, user)


class DeleteAccountView(APIView):
    """DELETE /api/auth/settings/account/ — verify password and cascade delete account."""
    permission_classes = [IsAuthenticated]
    def delete(self, request):
        serializer = DeleteAccountSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(
                {"message": first_error(serializer), "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        user.delete()
        response = Response({"message": "Account deleted successfully"})
        response.delete_cookie(settings.AUTH_COOKIE)
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH)
        return response
