from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model

class SettingsSerializer(serializers.ModelSerializer):
    total_applied = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "email", "date_joined", "total_applied"]
        read_only_fields = fields

    def get_total_applied(self, user) -> int:
        return user.applications.count()