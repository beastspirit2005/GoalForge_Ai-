import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Create a dummy token if needed, or we might get 401 Unauthorized
        # Actually let's just see if we get 401 or 500
        response = await client.post(
            "http://127.0.0.1:8000/skills/upload-resume",
            files={"file": ("test.txt", b"Python Developer with 5 years experience.", "text/plain")}
        )
        print("Status:", response.status_code)
        print("Response:", response.text)

if __name__ == "__main__":
    asyncio.run(test())
