import django_filters
from .models import Job

class JobFilter(django_filters.FilterSet):
    """
    Lookup	            SQL meaning	                            Use case
    (none)	            = exact match	                        source=naukri — must match a known choice exactly
    __icontains	        ILIKE '%…%' case-insensitive substring	location=bangalore matches "Bangalore, KA"
    __gte / __lte	    >= / <=	                                experience and salary ranges
    """

    location = django_filters.CharFilter(lookup_expr="icontains")
    company = django_filters.CharFilter(lookup_expr="icontains")

    experience = django_filters.NumberFilter(
        field_name="min_experience", lookup_expr="lte"
    )
    min_salary = django_filters.NumberFilter(
        field_name="max_salary", lookup_expr="gte"
    )

    posted_after = django_filters.DateFilter(
        field_name="posted_at", lookup_expr="gte"
    )

    class Meta:
        model = Job
        # Exact-match filters: these are fixed vocabularies, not free text.
        fields = ["source", "job_type", "employment_type", "industry", "function"]
