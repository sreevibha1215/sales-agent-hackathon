from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.auth import get_current_user

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    result = get_current_user(credentials.credentials)
    if not result["success"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    return result["user"]