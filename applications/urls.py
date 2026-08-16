from django.urls import path

from . import views

app_name = "applications"

urlpatterns = [
    path("", views.ApplicationListView.as_view(), name="list"),
    path("<int:pk>/", views.ApplicationDetailView.as_view(), name="detail"),
    path("activity/", views.ApplicationActivityView.as_view(), name="activity"),
    path("stats/", views.ApplicationStatsView.as_view(), name="stats"),
]
