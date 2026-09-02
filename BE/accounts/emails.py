from django.conf import settings
from django.core.mail import send_mail

from .models import EmailVerificationCode

def send_verification_code(user) -> str:
    code = EmailVerificationCode.issue(user)
    minutes = int(EmailVerificationCode.LIFETIME.total_seconds() // 60)

    subject = f"Your {settings.SITE_NAME} verification code"
    text_message = (
        f"Hi {user.username},\n\n"
        f"Your verification code is: {code}\n\n"
        f"It expires in {minutes} minutes. If you didn't create an "
        f"account, you can ignore this email.\n"
    )
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="color: #18181b; margin-bottom: 16px;">Hi {user.username},</h2>
        <p style="color: #3f3f46; font-size: 16px; margin-bottom: 24px;">Your <strong>{settings.SITE_NAME}</strong> verification code is:</p>
        <div style="background-color: #f4f4f5; padding: 16px 24px; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #09090b; text-align: center; margin-bottom: 24px;">
            {code}
        </div>
        <p style="color: #71717a; font-size: 14px;">This code expires in <strong>{minutes} minutes</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you didn't create an account or request this change, you can safely ignore this email.</p>
    </div>
    """

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        # Never let a mail failure roll back a successful registration —
        # the user can always request a resend.
        fail_silently=True,
    )
    return code

