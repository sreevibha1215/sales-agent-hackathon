import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from backend.auth.auth import signup_user, login_user, logout_user, get_current_user

load_dotenv()

app = FastAPI(title="Sales Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ---------- Models ----------
class AuthRequest(BaseModel):
    email: str
    password: str

class ConfigExtractRequest(BaseModel):
    text: str

# ---------- Auth Routes ----------
@app.post("/api/auth/signup")
async def signup(req: AuthRequest):
    result = signup_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Signup successful", "user": str(result["user"])}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    result = login_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return {"access_token": result["access_token"], "token_type": "bearer"}

@app.post("/api/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    result = logout_user(credentials.credentials)
    return {"message": "Logged out"}

@app.get("/api/auth/me")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    result = get_current_user(credentials.credentials)
    if not result["success"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": str(result["user"])}

# ---------- Config Extract Route ----------
@app.post("/api/config/extract")
async def config_extract(
    req: ConfigExtractRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify token first
    user = get_current_user(credentials.credentials)
    if not user["success"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # TODO: Person A will add LangGraph agent here
    return {
        "status": "ok",
        "input": req.text,
        "extracted": {
            "company_type": "B2B SaaS",
            "target_market": "SMBs",
            "region": "India"
        }
    }

@app.get("/")
async def root():
    return {"message": "Sales Agent API running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)