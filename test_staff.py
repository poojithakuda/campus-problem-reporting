import requests

BASE_URL = "http://127.0.0.1:8000"

# --- Step 1: Log in as admin ---
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin1@campus.com",
    "password": "Admin@123"
})
print("Admin login:", admin_login.status_code, admin_login.json())
admin_token = admin_login.json().get("access_token")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# --- Step 2: Assign staff user (id 6) to Electrical Department (id 1) ---
assign_response = requests.post(
    f"{BASE_URL}/departments/assign-staff",
    json={"user_id": 6, "department_id": 1},
    headers=admin_headers
)
print("Assign staff:", assign_response.status_code, assign_response.json())

# --- Step 3: Log in as staff user ---
staff_login = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "staff1@campus.com",
    "password": "Staff@123"
})
print("Staff login:", staff_login.status_code, staff_login.json())
staff_token = staff_login.json().get("access_token")
staff_headers = {"Authorization": f"Bearer {staff_token}"}

# --- Step 4: Fetch complaints assigned to staff's department ---
assigned = requests.get(f"{BASE_URL}/complaints/staff/assigned", headers=staff_headers)
print("Staff assigned complaints:", assigned.status_code, assigned.json())