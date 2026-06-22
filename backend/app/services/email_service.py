"""Email service – sends transactional emails via Brevo SMTP."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailDeliveryError(RuntimeError):
    """Raised when a transactional email cannot be sent."""


def _env_or_setting(name: str, default=None):
    value = os.getenv(name)
    if value is not None:
        return value
    return getattr(settings, name, default)


def _get_smtp_config():
    return {
        "host": _env_or_setting("SMTP_HOST") or "",
        "port": int(_env_or_setting("SMTP_PORT", 587) or 587),
        "user": _env_or_setting("SMTP_USER") or "",
        "password": _env_or_setting("SMTP_PASSWORD") or "",
        "from_email": _env_or_setting("SMTP_FROM_EMAIL") or "",
        "from_name": _env_or_setting("SMTP_FROM_NAME") or "GoalForge AI",
    }


def is_email_configured() -> bool:
    cfg = _get_smtp_config()
    return bool(cfg["host"] and cfg["port"] and cfg["user"] and cfg["password"])


def is_demo_mode() -> bool:
    return settings.DEMO_MODE


def _send_email(to_email: str, subject: str, text: str, html: str):
    # Skip actual email sending if DEMO_MODE is explicitly enabled
    if is_demo_mode():
        print(f"[DEMO MODE] Skipping smtplib SMTP email sending to {to_email}.")
        return

    cfg = _get_smtp_config()
    if not is_email_configured():
        raise EmailDeliveryError("Mailing service (SMTP) is not configured on this server.")

    from_addr = cfg["from_email"] or cfg["user"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f'{cfg["from_name"]} <{from_addr}>'
    msg["To"] = to_email

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        print(f"Connecting to SMTP {cfg['host']}:{cfg['port']}...")
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as server:
            server.starttls()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(from_addr, to_email, msg.as_string())
            print(f"Email sent successfully to {to_email}")
    except Exception as e:
        raise EmailDeliveryError(f"Failed to send email to {to_email}: {e}") from e


def send_approval_email(to_email: str, user_name: str, role: str):
    text = f"""
    Hello {user_name},

    Your GoalForge AI account has been approved by the administrator.
    You can now log in with the role: {role}.

    Welcome aboard!
    """

    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #4f46e5;">Welcome to GoalForge AI</h2>
        <p>Hello {user_name},</p>
        <p>Your account has been <strong>approved</strong> by the administrator.</p>
        <p>You can now log in and access the dashboard with the role: <strong>{role}</strong>.</p>
        <br>
        <p>Welcome aboard!</p>
      </body>
    </html>
    """

    _send_email(to_email, "Your GoalForge AI Account has been Approved", text, html)


def send_otp_email(to_email: str, user_name: str, otp_code: str):
    text = f"""
    Hello {user_name},

    Your GoalForge AI one-time login code is: {otp_code}

    This code will expire in 10 minutes. Do not share it with anyone.
    """

    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #4f46e5;">GoalForge AI – Login Code</h2>
        <p>Hello {user_name},</p>
        <p>Your one-time login code is:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background: #f0f0ff; padding: 16px 32px; border-radius: 12px; border: 2px dashed #4f46e5;">
            {otp_code}
          </span>
        </div>
        <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </body>
    </html>
    """

    _send_email(to_email, f"Your GoalForge AI Login Code: {otp_code}", text, html)
