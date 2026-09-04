import requests

url = "http://127.0.0.1:8000/auth/register"

admins = [
    {
        "full_name": "Admin 1",
        "email": "admin1@campus.com",
        "password": "Admin@123",
        "role": "admin"
    },
    {
        "full_name": "Admin 2",
        "email": "admin2@campus.com",
        "password": "Admin@123",
        "role": "admin"
    }
]

for admin in admins:
    response = requests.post(url, json=admin)

    print("Email:", admin["email"])
    print("Status:", response.status_code)
    print("Response:", response.text)
    print()