from django.urls import path

from . import views, profile_views

app_name = "accounts"

urlpatterns = [
    # User auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify/", views.VerifyEmailView.as_view(), name="verify"),
    path("resend/", views.ResendVerificationView.as_view(), name="resend"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    # Profile
    path("profile/", profile_views.ProfileView.as_view(), name="profile"),
    path("profile/personal/", profile_views.PersonalInfoView.as_view(), name="profile-personal"),
    path("profile/experience/", profile_views.ExperienceListView.as_view(), name="profile-experience"),
    path("profile/experience/<int:pk>/", profile_views.ExperienceDetailView.as_view(), name="profile-experience-detail"),
    path("profile/education/", profile_views.EducationListView.as_view(), name="profile-education"),
    path("profile/education/<int:pk>/", profile_views.EducationDetailView.as_view(), name="profile-education-detail"),
    path("profile/skills/", profile_views.SkillsView.as_view(), name="profile-skills"),
]
