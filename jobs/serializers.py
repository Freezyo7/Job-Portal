from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "source",
            "title",
            "company",
            "location",
            "url",
            "apply_url",
            "company_logo",
            "industry",
            "function",
            "job_type",
            "employment_type",
            "min_experience",
            "max_experience",
            "min_salary",
            "max_salary",
            "currency",
            "description",
            "skills",
            "applicant_count",
            "posted_at",
        ]

class JobListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "source",
            "title",
            "company",
            "location",
            "url",
            # Where the user actually applies — often the employer's own site
            # rather than the aggregator's listing page.
            "apply_url",
            "company_logo",
            "job_type",
            "employment_type",
            "min_experience",
            "max_experience",
            "min_salary",
            "max_salary",
            "currency",
            "description_text",
            "skills",
            "applicant_count",
            "posted_at",
        ]
