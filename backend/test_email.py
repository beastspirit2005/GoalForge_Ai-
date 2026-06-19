import asyncio
from app.services.email_service import send_otp_email, is_email_configured

async def test_email():
    if not is_email_configured():
        print("Email is NOT configured properly.")
        return

    try:
        # We will send a test email to the from_email itself to see if it delivers
        test_email = "harshit2500sharma@gmail.com"
        print(f"Attempting to send test OTP to {test_email}...")
        send_otp_email(test_email, "Test User", "123456")
        print("Success! Test email sent.")
    except Exception as e:
        print(f"Error sending email: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
