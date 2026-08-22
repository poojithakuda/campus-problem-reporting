import requests

BASE_URL = "http://127.0.0.1:8000"

# Log in as the STUDENT account (not admin)
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "studentfresh1@campus.com",
        "password": "123456"
    }
)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Try to access admin-only endpoint AS A STUDENT
response = requests.get(f"{BASE_URL}/complaints/", headers=headers)
print("Status Code:", response.status_code)
print("Response:", response.text)