from django.conf import settings
from django.core.mail import send_mail

from .models import EmailVerificationCode

def send_verification_code(user) -> str:
    code = EmailVerificationCode.issue(user)
    minutes = int(EmailVerificationCode.LIFETIME.total_seconds()//60)

    send_mail(
        subject=f"Your {settings.SITE_NAME} verification code",
        message=(
            f"Hi {user.username},\n\n"
            f"Your verification code is: {code}\n\n"
            f"It expires in {minutes} minutes. If you didn't create an "
            f"account, you can ignore this email.\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        # Never let a mail failure roll back a successful registration —
        # the user can always request a resend.
        fail_silently=True,
    )
    return code
