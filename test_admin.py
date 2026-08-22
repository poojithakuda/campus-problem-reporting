import requests

BASE_URL = "http://127.0.0.1:8000"

# ---- Step 1: Register an admin account (or reuse if it already exists) ----
register_response = requests.post(
    f"{BASE_URL}/auth/register",
    json={
        "full_name": "Test Admin",
        "email": "adminfresh1@campus.com",
        "password": "123456",
        "role": "admin"
    }
)
print("Register Status:", register_response.status_code)
print("Register Response:", register_response.text)

# ---- Step 2: Log in as admin ----
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "adminfresh1@campus.com",
        "password": "123456"
    }
)
print("\nLogin Status:", login_response.status_code)
print("Login Response:", login_response.text)

if login_response.status_code != 200:
    print("Login failed, stopping here.")
    exit()

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# ---- Step 3: Get all complaints (admin only) ----
all_complaints_response = requests.get(f"{BASE_URL}/complaints/", headers=headers)
print("\nAll Complaints Status:", all_complaints_response.status_code)
print("All Complaints Response:", all_complaints_response.text)

# ---- Step 4: Get all departments ----
departments_response = requests.get(f"{BASE_URL}/departments/", headers=headers)
print("\nDepartments Status:", departments_response.status_code)
print("Departments Response:", departments_response.text)