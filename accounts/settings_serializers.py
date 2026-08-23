from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

class SettingsSerializer(serializers.ModelSerializer):
    total_applied = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "email", "date_joined", "total_applied"]
        read_only_fields = fields

    def get_total_applied(self, user) -> int:
        return user.applications.count()

class UpdateAccountSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, min_length=1)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ["username", "email"]

    def validate_username(self, value):
        user = self.context["request"].user
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username cannot be blank.")
        if User.objects.exclude(pk=user.pk).filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        
        return value
    
    def validate_email(self, value):
        user = self.context["request"].user
        value = value.lower().strip()

        if User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        
        return value

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field must be provided.")
        
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True, min_length=6, style={"input_type": "password"}
    )

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")

        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        validate_password(value, user=user)
        return value

    def validate(self, attrs):
        if attrs.get("current_password") == attrs.get("new_password"):
            raise serializers.ValidationError(
                {"new_password": "New password cannot be the same as current password."}
            )
        return attrs

class DeleteAccountSerializer(serializers.Serializer):
    """Requires password confirmation prior to deleting the account."""
    password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    def validate_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect.")
        return value