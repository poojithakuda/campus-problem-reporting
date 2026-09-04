import requests

url = "http://127.0.0.1:8000/auth/register"

data = {
    "full_name": "Test Admin",
    "email": "admin1@campus.com",
    "password": "Admin@123",
    "role": "admin"
}

data = {
    "full_name": "Test Admin 2",
    "email": "admin2@campus.com",
    "password": "Admin@123",
    "role": "admin"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response Body:", response.text)