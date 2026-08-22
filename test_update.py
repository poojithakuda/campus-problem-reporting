import requests

BASE_URL = "http://127.0.0.1:8000"

# Log in as admin
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "adminfresh1@campus.com",
        "password": "123456"
    }
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Update complaint ID 1 — assign to Electrical Department (id 1), change status
update_response = requests.patch(
    f"{BASE_URL}/complaints/1",
    json={
        "status": "Assigned",
        "assigned_department_id": 1
    },
    headers=headers
)

print("Update Status:", update_response.status_code)
print("Update Response:", update_response.text)