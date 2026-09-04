from django.urls import path

from . import views

app_name = "jobs"

urlpatterns = [
    path("logo/", views.job_logo_proxy, name="logo-proxy"),
    path("stats/", views.JobStatsView.as_view(), name="job-stats"),
    path("", views.JobListView.as_view(), name="job-list"),
    path("<int:pk>/", views.JobDetailView.as_view(), name="job-detail"),
]