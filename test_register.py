import requests

url = "http://127.0.0.1:8000/auth/register"

data = {
    "full_name": "Test Student",
    "email": "testlogin@campus.com",
    "password": "Test@123",
    "role": "student"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response Body:", response.text)