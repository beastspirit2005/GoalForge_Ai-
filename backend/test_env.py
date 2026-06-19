import os
from app.core.config import settings
from app.services.email_service import _get_smtp_config, is_email_configured

print("ENV SMTP_HOST:", os.getenv("SMTP_HOST"))
print("ENV SMTP_PASSWORD:", os.getenv("SMTP_PASSWORD"))
print("SETTINGS SMTP_HOST:", settings.SMTP_HOST)
print("SETTINGS SMTP_PASSWORD:", settings.SMTP_PASSWORD)
print("CONFIG:", _get_smtp_config())
print("CONFIGURED:", is_email_configured())
