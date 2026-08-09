import requests

session = requests.Session()
base_url = "http://127.0.0.1:8000/api/auth"

# Register
res = session.post(f"{base_url}/register/", json={
    "username": "testuser_profile",
    "email": "test@example.com",
    "password": "password123"
})
print("Register:", res.status_code, res.text)

# Login
res = session.post(f"{base_url}/login/", json={
    "username": "testuser_profile",
    "password": "password123"
})
print("Login:", res.status_code, res.text)

# Get Profile
res = session.get(f"{base_url}/profile/")
print("Get Profile:", res.status_code, res.text)

# Update Profile
res = session.put(f"{base_url}/profile/", json={
    "full_name": "Test User",
    "address": "123 Test St",
    "pincode": "123456",
    "mobile": "9876543210"
})
print("Update Profile:", res.status_code, res.text)

# Get Profile Again
res = session.get(f"{base_url}/profile/")
print("Get Profile Again:", res.status_code, res.text)
