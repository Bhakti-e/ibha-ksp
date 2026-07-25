"""
Test login endpoint directly
"""
import requests
import json

url = "http://localhost:8000/api/v1/auth/login"
payload = {
    "email": "rajesh.kumar@ksp.gov.in",
    "password": "password123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("-" * 50)

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")
