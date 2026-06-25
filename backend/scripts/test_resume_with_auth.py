import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_data = {
            "username": "harshit2005sharma@gmail.com",
            "password": "welcome@2029",
        }
        r = await client.post("http://127.0.0.1:8000/auth/login", json=login_data)
        if r.status_code != 200:
            print("Login failed:", r.status_code, r.text)
            return
        
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Upload resume
        print("Uploading resume...")
        try:
            r2 = await client.post(
                "http://127.0.0.1:8000/skills/upload-resume",
                headers=headers,
                files={"file": ("test.txt", b"Python Developer with 5 years experience in React.", "text/plain")}
            )
            print("Status:", r2.status_code)
            print("Response:", r2.text)
        except Exception as e:
            print("Exception during upload:", e)

if __name__ == "__main__":
    asyncio.run(test())
