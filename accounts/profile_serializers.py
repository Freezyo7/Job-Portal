from pathlib import Path
from .models import Education, Experience, Profile

from django.conf import settings
from rest_framework import serializers

from .models import Education, Experience, Profile

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            "id",
            "title",
            "company",
            "employment_type",
            "start_date",
            "end_date",
            "current",
        ]
        read_only_fields = ["id"]

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            "id",
            "institution",
            "degree",
            "field_of_study",
            "grade",
            "start_date",
            "end_date",
            "current",
        ]
        read_only_fields = ["id"]

class ProfileSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer(many=True, read_only=True)
    education = EducationSerializer(many=True, read_only=True)

    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "designation",
            "phone",
            "contact_email",
            "country",
            "city",
            "full_address",
            "dob",
            "gender",
            "summary",
            "linkedin",
            "github",
            "portfolio",
            "skills",
            "resume_file_name",
            "resume_parsed_at",
            "experience",
            "education",
        ]
        read_only_fields = ["resume_file_name", "resume_parsed_at"]

class PersonalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "first_name",
            "last_name",
            "designation",
            "phone",
            "contact_email",
            "country",
            "city",
            "full_address",
            "dob",
            "gender",
            "summary",
            "linkedin",
            "github",
            "portfolio",
        ]

class SkillsSerializer(serializers.Serializer):
    skills = serializers.ListField(
        child=serializers.CharField(max_length=80, allow_blank=False),
        allow_empty=True,
        max_length=100,
    )
    def validate_skills(self, value):
        seen, cleaned= set(), []
        for raw in value:
            skill = raw.strip()
            if skill and skill.lower() not in seen:
                seen.add(skill.lower())
                cleaned.append(skill)
        return cleaned


class ResumeUploadSerializer(serializers.Serializer):
    """Validates the upload before it costs us a parse."""

    ALLOWED_SUFFIXES = {".pdf"}
    ALLOWED_TYPES = {"application/pdf", "application/x-pdf"}
    PDF_MAGIC = b"%PDF-"

    resume = serializers.FileField()

    def validate_resume(self, upload):
        if upload.size > settings.RESUME_MAX_BYTES:
            limit_mb = settings.RESUME_MAX_BYTES // (1024 * 1024)
            raise serializers.ValidationError(
                f"That file is larger than {limit_mb} MB"
            )
        if not upload.size:
            raise serializers.ValidationError("That file is empty.")

        if Path(upload.name).suffix.lower() not in self.ALLOWED_SUFFIXES:
            raise serializers.ValidationError("Please upload a PDF.")

        if upload.content_type and upload.content_type not in self.ALLOWED_TYPES:
            raise serializers.ValidationError("Please upload a PDF.")

        header = upload.read(len(self.PDF_MAGIC))
        upload.seek(0)
        if header != self.PDF_MAGIC:
            raise serializers.ValidationError("That file is not a valid PDF.")

        return upload
