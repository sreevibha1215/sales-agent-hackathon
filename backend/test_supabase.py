# backend/test_supabase.py

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:20]}...")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client created successfully!")
    
    # Test connection
    response = supabase.table("workspaces").select("*").limit(1).execute()
    print("✅ Connection successful!")
    
except Exception as e:
    print(f"❌ Error: {e}")