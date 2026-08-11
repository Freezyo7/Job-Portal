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
    SkillsSerializer
)

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