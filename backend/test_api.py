# backend/test_env.py
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

print("=== .env VALUES ===")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_KEY')}")
print(f"GROQ_API_KEY: {os.getenv('GROQ_API_KEY')[:10] if os.getenv('GROQ_API_KEY') else 'MISSING'}...")