import asyncio
import httpx
from app.core.database import async_session
from app.models.user import User
from sqlalchemy import select

async def test():
    print("Requesting OTP...")
    r = httpx.post('http://127.0.0.1:8000/auth/request-otp', json={'phone_number': '+1234567890'})
    print("Request status:", r.status_code)
    
    async with async_session() as db:
        user = (await db.execute(select(User).where(User.email == 'employee@example.com'))).scalar_one()
        code = user.otp_code
        print("OTP from DB:", code)
        
    print("Verifying OTP...")
    r2 = httpx.post('http://127.0.0.1:8000/auth/verify-otp', json={'phone_number': '+1234567890', 'otp_code': code})
    print("Verify status:", r2.status_code)
    print("Verify response:", r2.json())

asyncio.run(test())
