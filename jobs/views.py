from urllib.parse import urlparse

import requests
from django.http import HttpResponse, JsonResponse
from rest_framework import generics

from .filters import JobFilter
from .models import Job
from .serializers import JobListSerializer, JobSerializer


class JobListView(generics.ListAPIView):
    """GET /api/jobs/ — filterable, searchable, paginated job list."""

    serializer_class = JobListSerializer
    filterset_class = JobFilter

    search_fields = ["title", "company", "skills", "description_text"]

    ordering_fields = ["posted_at", "min_salary", "max_salary", "applicant_count"]
    ordering = ["-posted_at"]

    def get_queryset(self):
        # Dead listings are never shown — a business rule, not a user choice,
        # so it lives here rather than in JobFilter.
        return Job.objects.filter(is_active=True)


class JobDetailView(generics.RetrieveAPIView):
    """GET /api/jobs/<id>/ — one job, including full HTML description."""

    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer


def job_logo_proxy(request):
    """GET /api/jobs/logo/?url=… — fetch a remote company logo server-side.

    Many source CDNs reject requests whose Referer isn't their own domain, so
    logos 403 when the browser loads them directly. Fetching server-side with a
    matching Referer works, and also keeps the user's IP out of those CDN logs.
    """
    raw_url = request.GET.get("url", "").strip()
    if not raw_url:
        return JsonResponse({"error": "Missing logo url"}, status=400)

    parsed = urlparse(raw_url)
    # Reject anything that isn't plain http(s) — file://, ftp://, etc. could be
    # used to make this server read local files on the client's behalf.
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return JsonResponse({"error": "Invalid logo url"}, status=400)

    try:
        upstream = requests.get(
            raw_url,
            timeout=10,
            headers={
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "accept": "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
                "referer": f"{parsed.scheme}://{parsed.netloc}/",
            },
        )
    except requests.RequestException:
        return JsonResponse({"error": "Unable to fetch remote logo"}, status=502)

    if not upstream.ok:
        return JsonResponse({"error": "Logo fetch failed"}, status=upstream.status_code)

    content_type = upstream.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        return JsonResponse({"error": "Remote file is not an image"}, status=415)

    response = HttpResponse(upstream.content, content_type=content_type)
    # Logos essentially never change; cache hard so we stop re-proxying them.
    response["Cache-Control"] = "public, max-age=86400"
    return response