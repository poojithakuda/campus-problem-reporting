import requests

url = "http://127.0.0.1:8000/auth/login"

data = {
    "email": "testlogin@campus.com",
    "password": "Test@123"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response Body:", response.text)