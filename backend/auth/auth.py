import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

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
        # Decode JWT locally without Supabase call
        import base64, json
        payload = jwt.split(".")[1]
        # Add padding
        payload += "=" * (4 - len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))
        return {"success": True, "user": decoded}
    except Exception as e:
        return {"success": False, "error": str(e)}