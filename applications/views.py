from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application
from .serializers import ApplicationSerializer, ApplySerializer
from django.shortcuts import render

# Create your views here.

class ApplicationListView(APIView):
    """GET 
        POST"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        application = (
            Application.objects.filter(user=request.user)
            .select_related("job")
        )
        return Response(ApplicationSerializer(application, many=True).data)

    def post(self, request):
        serializer = ApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        application, created = Application.objects.get_or_create(
            user = request.user, job = serializer.job
        )

        return Response(
            {
                "already_applied": not created,
                "application": ApplySerializer(application).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

class ApplicationDetailView(APIView):
    """Delete"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        application = get_object_or_404(Application, pk=pk, user=request.user)
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

def _application_per_day(user, year=None):
    row = Application.objects.filter(user=user)
    if year is None:
        rows = rows.filter(applied_at__year=year)

    return [
        (row["day"], row["count"])
        for row in row.annotate(day=TruncDate("applied_at")
                                .values("day")
                                .order_by("day"))
    ]

def _streaks(days):
    if not days:
        return 0,0

    longest = run = 1
    for previous, current in zip(days, days[1:]):
        run = run + 1 if current - previous == timedelta(days=1) else 1
        longest = max(longest, run)

    today = timezone.localdate()
    current = run if days[-1] in (today, today - timedelta(days=1)) else 0
    return current, longest

class ApplicationActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw_year = request.query_params.get("year")
        if raw_year is None:
            year = timezone.localdate().year
        else:
            try:
                year = int(raw_year)

            except ValueError:
                return Response(
                    {"message" : "year must be a number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(
            [
                {"date": day.isoformat(), "count": count}
                for day , count in _application_per_day(request.user, year)
            ]
        )

class ApplicationStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        per_day = _application_per_day(request.user)
        days = [day for day, _ in per_day]
        current_streak, longest_streak = _streaks(days)

        today = timezone.localdate()
        week_start = today - timedelta(days = today.weekday())
        month_start = today.replace(day=1)

        return Response(
            {
                "total_applied": sum(count for _, count in per_day),
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "applied_this_week": sum(
                    count for day, count in per_day if day >= week_start
                ),
                "applied_this_month": sum(
                    count for day, count in per_day if day >= month_start
                ),
            }
        )