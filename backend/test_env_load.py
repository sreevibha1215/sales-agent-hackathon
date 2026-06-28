# backend/test_env_load.py
import os
from dotenv import load_dotenv

# Try loading from current directory
load_dotenv()
print(f"Current dir load: URL={os.getenv('SUPABASE_URL')}")

# Try loading from explicit path
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
print(f"Explicit load: URL={os.getenv('SUPABASE_URL')}")

# Print the path
print(f"Looking for: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")