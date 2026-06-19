import requests

# 1. Login as admin to get token
resp = requests.post("http://localhost:8000/auth/login", json={
    "email": "admin@example.com",
    "password": "password123"
})
if resp.status_code != 200:
    print("Login failed:", resp.status_code, resp.text)
    exit(1)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Register a new user
resp = requests.post("http://localhost:8000/auth/register", json={
    "email": "testnew_7@example.com",
    "password": "password123",
    "name": "Test New 1"
})
if resp.status_code != 201:
    print("Register failed:", resp.status_code, resp.text)
    exit(1)
new_user_id = resp.json()["id"]
print("Registered new user", new_user_id)

# 3. Approve user as admin
resp = requests.post(f"http://localhost:8000/admin/users/{new_user_id}/approve", headers=headers)
print("Approve response:", resp.status_code, resp.text)
