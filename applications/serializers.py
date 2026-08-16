from rest_framework import serializers

from jobs.models import Job

from .models import Application

class ApplicationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company",
            "company_logo",
            "location",
            "url",
            "apply_url",
            "job_type",
            "employment_type",
        ]

class ApplicationSerializer(serializers.ModelSerializer):
    job = ApplicationJobSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ["id", "job", "applied_at"]
        read_only_fields = fields

class ApplySerializer(serializers.Serializer):
    job_id = serializers.IntegerField()

    def validate_job_id(self, value):
        try:
            self.job = Job.objects.get(pk=value)

        except Job.DoesNotExist:
            raise serializers.ValidationError("That job does not exist.")
        return value
