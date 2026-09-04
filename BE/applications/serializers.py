from rest_framework import serializers

from jobs.models import Job

from .models import Application

class ApplicationSerializer(serializers.ModelSerializer):
    # Built from Application's own snapshot columns, not a live join to Job —
    # this must keep rendering correctly after the source Job row is pruned
    # or its FK goes SET_NULL. `id` is the live job's id when it still
    # exists (None once pruned); everything else is the snapshot, so the
    # title/company/logo/link never disappear.
    job = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "job",
            "contact_name",
            "contact_email",
            "contact_linkedin",
            "applied_at",
        ]
        read_only_fields = ["id", "job", "applied_at"]

    def get_job(self, obj):
        return {
            "id": obj.job_id,
            "source": obj.job_source,
            "title": obj.job_title,
            "company": obj.job_company,
            "company_logo": obj.job_company_logo,
            "location": obj.job_location,
            "url": obj.job_url,
            "apply_url": obj.job_apply_url,
        }

class UpdateApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ["contact_name", "contact_email", "contact_linkedin"]

class ApplySerializer(serializers.Serializer):
    job_id = serializers.IntegerField()

    def validate_job_id(self, value):
        try:
            self.job = Job.objects.get(pk=value)

        except Job.DoesNotExist:
            raise serializers.ValidationError("That job does not exist.")
        return value
