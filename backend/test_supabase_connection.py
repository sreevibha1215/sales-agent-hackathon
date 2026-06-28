# backend/test_supabase_connection.py

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"🔑 URL: {SUPABASE_URL}")
print(f"🔑 KEY: {SUPABASE_KEY[:20]}...")

try:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client created!")

    # Try a simple auth test
    try:
        response = client.auth.sign_up({"email": "test@test.com", "password": "test123"})
        print("✅ Auth signup test passed!")
    except Exception as e:
        print(f"⚠️ Signup test: {e}")

except Exception as e:
    print(f"❌ Error: {e}")