"""Email service – sends transactional emails via Brevo SMTP."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))


def _get_smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST", "smtp-relay.brevo.com"),
        "port": int(os.environ.get("SMTP_PORT", 587)),
        "user": os.environ.get("SMTP_USER", "acc1af001@smtp-brevo.com"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "from_email": os.environ.get("SMTP_FROM_EMAIL"),
        "from_name": os.environ.get("SMTP_FROM_NAME", "GoalForge AI"),
    }


def _send_email(to_email: str, subject: str, text: str, html: str):
    cfg = _get_smtp_config()
    if not cfg["password"]:
        print("Warning: SMTP_PASSWORD is not set. Email not sent.")
        return

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
        print(f"Failed to send email to {to_email}: {e}")


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
