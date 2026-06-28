import os
import json
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

r = redis.from_url(REDIS_URL, decode_responses=True)

def save_to_memory(workspace_id: str, key: str, value: dict):
    """Save data to Redis"""
    try:
        r.set(f"{workspace_id}:{key}", json.dumps(value), ex=86400)  # 24hr expiry
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_from_memory(workspace_id: str, key: str):
    """Get data from Redis"""
    try:
        data = r.get(f"{workspace_id}:{key}")
        if data:
            return {"success": True, "data": json.loads(data)}
        return {"success": True, "data": None}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_from_memory(workspace_id: str, key: str):
    """Delete data from Redis"""
    try:
        r.delete(f"{workspace_id}:{key}")
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def list_workspace_keys(workspace_id: str):
    """List all keys for a workspace"""
    try:
        keys = r.keys(f"{workspace_id}:*")
        return {"success": True, "keys": keys}
    except Exception as e:
        return {"success": False, "error": str(e)}