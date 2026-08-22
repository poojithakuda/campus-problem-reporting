import requests

url = "http://127.0.0.1:8000/auth/register"

data = {
    "full_name": "Test Staff",
    "email": "staff1@campus.com",
    "password": "Staff@123",
    "role": "staff"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response Body:", response.text)
