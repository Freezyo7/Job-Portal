import logging
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.throttling import ScopedRateThrottle

from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Education, Experience, Profile
from .profile_serializers import (
    EducationSerializer,
    ExperienceSerializer,
    PersonalInfoSerializer,
    ProfileSerializer,
    SkillsSerializer,
    ResumeUploadSerializer,
)
from .resume_parsers import ResumeParseError, parse_resume

logger = logging.getLogger(__name__)

class ProfileView(APIView):
    """Get /api/profile/"""

    permission_classes = [IsAuthenticated]

    def get(self,request):
        profile,_ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

class PersonalInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = PersonalInfoSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileSerializer(profile).data)

class ExperienceListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ExperienceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ExperienceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        entry = get_object_or_404(
            Experience, pk=pk, profile__user=request.user
        )
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EducationListView(APIView):
    """POST /api/profile/education — add one entry."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = EducationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EducationDetailView(APIView):
    """DELETE /api/profile/education/<id> — remove one entry."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        entry = get_object_or_404(
            Education, pk=pk, profile__user=request.user
        )
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SkillsView(APIView):
    """PATCH /api/profile/skills — replace the whole skills list."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = SkillsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile.skills = serializer.validated_data["skills"]
        profile.save(update_fields=["skills"])
        return Response({"skills": profile.skills})


def _with_schema(url: str) -> str:
    """Resumes list profile links bare ('linkedin.com/in/x'), but the model
    stores them in a URLField, which rejects a missing scheme."""
    url = (url or "").strip()
    if url and not url.startswith(("http://", "https://")):
        return f"https://{url}"
    return url


class ResumeUploadView(APIView):
    """POST /api/auth/profile/resume/ — store a resume and return its fields.

    The parsed data is returned for the user to review, never written to the
    profile here: an extraction mistake should not silently overwrite what
    they typed themselves.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "resume"

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["resume"]

        # Parse before storing: a file we cannot read is not worth keeping,
        # and this leaves any previous resume in place on failure.
        try:
            parsed = parse_resume(upload)
        except ResumeParseError as exc:
            return Response(
                {"message": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )

        for field in ("linkedin", "github", "portfolio"):
            parsed[field] = _with_schema(parsed[field])

        profile, _ = Profile.objects.get_or_create(user=request.user)
        # Replacing a resume should not leave the old file behind.
        if profile.resume:
            profile.resume.delete(save=False)

        upload.seek(0)
        profile.resume = upload
        profile.resume_file_name = Path(upload.name).name[:255]
        profile.resume_parsed_at = timezone.now()
        profile.save(
            update_fields=["resume", "resume_file_name", "resume_parsed_at"]
        )

        return Response(
            {
                "resume_file_name": profile.resume_file_name,
                "resume_parsed_at": profile.resume_parsed_at,
                "parsed": parsed,
            }
        )


class ResumeDownloadView(APIView):
    """GET /api/auth/profile/resume/download/ — stream the caller's resume.

    MEDIA_ROOT is not served by the web server, so this view is the only way
    to reach the file, and it only ever opens request.user's own.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(Profile, user=request.user)
        if not profile.resume:
            raise Http404

        try:
            handle = profile.resume.open("rb")
        except FileNotFoundError:
            # Row survived but the file is gone (restored DB, cleared disk).
            logger.warning("Missing resume file for user %s", request.user.pk)
            raise Http404

        return FileResponse(
            handle,
            as_attachment=True,
            filename=profile.resume_file_name or "resume.pdf",
            content_type="application/pdf",
        )