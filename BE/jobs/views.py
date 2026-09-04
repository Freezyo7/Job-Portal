import mimetypes
from urllib.parse import urlparse

import requests
from django.db.models import Count, F
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import JobFilter
from .models import Job
from .serializers import JobListSerializer, JobSerializer

from .search import search_jobs

class JobPagination(PageNumberPagination):
    """Lets the client choose a page size, within a hard ceiling.

    Without max_page_size a client could send ?page_size=1000000 and force a
    full-table serialization on every request.
    """

    page_size_query_param = "page_size"
    max_page_size = 100


class JobListView(generics.ListAPIView):
    """GET /api/jobs/ — filterable, searchable, paginated job list."""

    serializer_class = JobListSerializer
    filterset_class = JobFilter
    pagination_class = JobPagination

    # Relevance search replaces DRF's SearchFilter — see jobs/search.py.
    ordering_fields = ["posted_at", "min_salary", "max_salary", "applicant_count"]
    # No `ordering` default here: OrderingFilter would re-sort search results
    # by date and silently discard the relevance ranking.

    def get_queryset(self):
        # Dead listings are never shown — a business rule, not a user choice,
        # so it lives here rather than in JobFilter.
        queryset = Job.objects.filter(is_active=True)

        search = self.request.query_params.get("search", "")
        if search:
            return search_jobs(queryset, search)

        # nulls_last: a missing posted_at (e.g. every Instahyre listing)
        # would otherwise sort first in Postgres and dominate page 1.
        return queryset.order_by(F("posted_at").desc(nulls_last=True), "-created_at")

class JobStatsView(APIView):
    """GET /api/jobs/stats/ — counts for the source-filter pills and the
    "fetched today" live badge. Cheap aggregate query, not paginated data."""

    def get(self, request):
        queryset = Job.objects.filter(is_active=True)
        today_start = timezone.localtime().replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        by_source = dict(
            queryset.values_list("source")
            .annotate(n=Count("id"))
            .values_list("source", "n")
        )

        return Response({
            "total": queryset.count(),
            "by_source": by_source,
            # "Fetched today" — a scrape run touching an existing row still
            # bumps updated_at, so this reflects today's scraper activity
            # regardless of how old the listing's posted_at is.
            "fetched_today": queryset.filter(updated_at__gte=today_start).count(),
        })


class JobDetailView(generics.RetrieveAPIView):
    """GET /api/jobs/<id>/ — one job, including full HTML description."""

    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer


# Magic-byte signatures for the formats logo CDNs actually serve. Checked
# only when both the response header and the URL extension are unhelpful.
_IMAGE_SIGNATURES = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    (b"RIFF", "image/webp"),          # WebP: 'RIFF'....'WEBP' — checked below
    (b"<svg", "image/svg+xml"),
    (b"<?xml", "image/svg+xml"),
]


def _sniff_image_type(content: bytes) -> str | None:
    for signature, mime in _IMAGE_SIGNATURES:
        if not content.startswith(signature):
            continue
        if signature == b"RIFF":
            return mime if content[8:12] == b"WEBP" else None
        return mime
    return None


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
        # Some CDNs (seen on Instahyre's S3/CloudFront-hosted logos) serve a
        # perfectly good image with a generic application/octet-stream
        # content-type because the object's metadata was never set. Don't
        # take the header's word for it — guess from the URL extension, or
        # from the file's own magic bytes, before giving up.
        guessed = mimetypes.guess_type(parsed.path)[0]
        content_type = guessed if guessed and guessed.startswith("image/") else None
        content_type = content_type or _sniff_image_type(upstream.content)
        if not content_type:
            return JsonResponse({"error": "Remote file is not an image"}, status=415)

    response = HttpResponse(upstream.content, content_type=content_type)
    # Logos essentially never change; cache hard so we stop re-proxying them.
    response["Cache-Control"] = "public, max-age=86400"
    return response