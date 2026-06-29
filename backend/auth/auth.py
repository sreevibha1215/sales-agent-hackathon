# backend/auth/auth.py

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / '.env')  # root .env
load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')  
# Load .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL:
    raise ValueError("❌ SUPABASE_URL is None!")
if not SUPABASE_KEY:
    raise ValueError("❌ SUPABASE_KEY is None!")

# CREATE SUPABASE CLIENT
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def signup_user(email: str, password: str):
    try:
        response = supabase.auth.sign_up({"email": email, "password": password})
        return {"success": True, "user": response.user, "session": response.session}
    except Exception as e:
        return {"success": False, "error": str(e)}

def login_user(email: str, password: str):
    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        return {"success": True, "access_token": response.session.access_token, "user": response.user}
    except Exception as e:
        return {"success": False, "error": str(e)}

def logout_user(jwt: str):
    try:
        supabase.auth.sign_out()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_current_user(jwt: str):
    try:
        user = supabase.auth.get_user(jwt)
        if user and user.user:
            return {"success": True, "user": {"sub": user.user.id, "email": user.user.email}}
        return {"success": False, "error": "Invalid token"}
    except Exception as e:
        return {"success": False, "error": str(e)}
