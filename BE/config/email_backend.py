import logging
import resend
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):
    """
    Custom Django Email Backend for Resend.
    """

    def __init__(self, api_key=None, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = api_key or getattr(settings, "RESEND_API_KEY", "")
        if self.api_key:
            resend.api_key = self.api_key

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY is not configured in Django settings.")
            logger.error("RESEND_API_KEY is not set. Email dispatch skipped.")
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                from_email = message.from_email or getattr(
                    settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev"
                )
                recipients = message.to if isinstance(message.to, list) else [message.to]

                params = {
                    "from": from_email,
                    "to": recipients,
                    "subject": message.subject,
                }

                # Check for HTML content in alternatives or html parameter
                html_content = getattr(message, "html_message", None)
                if not html_content and hasattr(message, "alternatives"):
                    for content, mimetype in message.alternatives:
                        if mimetype == "text/html":
                            html_content = content
                            break

                if html_content:
                    params["html"] = html_content
                    if message.body:
                        params["text"] = message.body
                else:
                    # Provide text content and fall back to simple HTML representation if needed
                    params["text"] = message.body
                    params["html"] = f"<p>{message.body.replace(chr(10), '<br>')}</p>"

                resend.Emails.send(params)
                num_sent += 1
            except Exception as e:
                logger.exception("Failed to send email via Resend API: %s", e)
                if not self.fail_silently:
                    raise e

        return num_sent
