import requests

BASE_URL = "http://127.0.0.1:8000"

# ---- Step 1: Log in to get a real access token ----
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "studentfresh1@campus.com",   # use an email you already registered
        "password": "123456"
    }
)

print("Login Status:", login_response.status_code)
print("Login Response:", login_response.text)

if login_response.status_code != 200:
    print("Login failed, stopping here.")
    exit()

token = login_response.json()["access_token"]

# ---- Step 2: Use the token to create a complaint ----
headers = {
    "Authorization": f"Bearer {token}"
}

data = {
    "category": "Electrical",
    "location": "Block A, 2nd Floor",
    "description": "The lights are not working.",
    "image_path": None
}

complaint_response = requests.post(
    f"{BASE_URL}/complaints/",
    json=data,
    headers=headers
)

print("\nComplaint Status:", complaint_response.status_code)
print("Complaint Response:", complaint_response.text)

# ---- Step 3: Fetch "my complaints" using the same token ----
my_complaints_response = requests.get(
    f"{BASE_URL}/complaints/my",
    headers=headers
)

print("\nMy Complaints Status:", my_complaints_response.status_code)
print("My Complaints Response:", my_complaints_response.text)