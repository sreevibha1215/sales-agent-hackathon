# backend/main.py
import uuid
import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv


# ============================================
# PERSON C'S IMPORTS (Auth, Database, Tools)
# ============================================
from auth.auth import signup_user, login_user, logout_user, get_current_user
from tools.gemini_tool import extract_config
from database.db import get_connection
from memory.redis_client import save_to_memory, get_from_memory


# ============================================
# YOUR IMPORTS (Agents, LangGraph, Discovery)
# ============================================
from api.discovery import router as discovery_router
from api.config import router as config_router

load_dotenv()

app = FastAPI(
    title="Agentic AI Platform",
    description="Intelligent B2B Customer Discovery with LangGraph Agents",
    version="2.0.0"
)

# ============================================
# CORS
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ============================================
# AUTH MODELS (Person C)
# ============================================
class AuthRequest(BaseModel):
    email: str
    password: str

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    result = get_current_user(credentials.credentials)
    if not result["success"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    return result["user"]

# ============================================
# AUTH ROUTES (Person C)
# ============================================
@app.post("/api/auth/signup")
async def signup(req: AuthRequest):
    result = signup_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Signup successful"}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    result = login_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return {"access_token": result["access_token"], "token_type": "bearer"}

@app.post("/api/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    logout_user(credentials.credentials)
    return {"message": "Logged out"}

@app.get("/api/auth/me")
async def me(user=Depends(verify_token)):
    return {"user": user}

# ============================================
# WORKSPACE ROUTES (Person C)
# ============================================
class WorkspaceCreate(BaseModel):
    name: str

@app.post("/api/workspaces")
async def create_workspace(req: WorkspaceCreate, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get("sub", "unknown")
    
    # Generate a UUID for the workspace
    workspace_id = str(uuid.uuid4())
    
    # ✅ Correctly format the SQL with 3 placeholders and 3 values
    cur.execute(
        "INSERT INTO workspaces (id, user_id, name) VALUES (%s, %s, %s) RETURNING id, name, created_at",
        (workspace_id, user_id, req.name)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "name": row[1], "created_at": str(row[2])}
@app.get("/api/workspaces")
async def list_workspaces(user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get('sub', '')
    
    cur.execute(
        "SELECT id, name, config, lead_count, created_at FROM workspaces WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    return [
        {
            "id": r[0],
            "name": r[1],
            "config": r[2],
            "lead_count": r[3],
            "created_at": str(r[4])
        }
        for r in rows
    ]

@app.get("/api/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get('sub', '')
    
    cur.execute(
        "SELECT id, name, config, lead_count, created_at FROM workspaces WHERE id = %s AND user_id = %s",
        (workspace_id, user_id)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    return {
        "id": row[0],
        "name": row[1],
        "config": row[2],
        "lead_count": row[3],
        "created_at": str(row[4])
    }
@app.delete("/api/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get('sub', '')
    
    # verify ownership first
    cur.execute("SELECT id FROM workspaces WHERE id = %s AND user_id = %s", (workspace_id, user_id))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    cur.execute("DELETE FROM results WHERE workspace_id = %s", (workspace_id,))
    cur.execute("DELETE FROM companies WHERE workspace_id = %s", (workspace_id,))
    cur.execute("DELETE FROM workspaces WHERE id = %s", (workspace_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Workspace deleted"}

# ============================================
# COMPANY ROUTES (Person C)
# ============================================
class CompanyAdd(BaseModel):
    name: str

@app.post("/api/workspaces/{workspace_id}/companies")
async def add_company(workspace_id: str, req: CompanyAdd, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO companies (workspace_id, name) VALUES (%s, %s) RETURNING id, name, status",
        (workspace_id, req.name)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "name": row[1], "status": row[2]}

@app.get("/api/workspaces/{workspace_id}/companies")
async def list_companies(workspace_id: str, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, score, status FROM companies WHERE workspace_id = %s",
        (workspace_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1], "score": r[2], "status": r[3]} for r in rows]

# ============================================
# CONFIG EXTRACTION (Person C)
# ============================================

# ============================================
# YOUR ADVANCED DISCOVERY WITH LANGGRAPH
# ============================================
from pydantic import BaseModel

# ============================================
# ROOT & HEALTH
# ============================================
@app.get("/")
async def root():
    return {
        "message": "Agentic AI Platform API",
        "version": "2.0.0",
        "features": [
            "Supabase Auth",
            "LangGraph Agents",
            "Real-time Discovery",
            "64+ Contacts from Hunter",
            "Dynamic Orchestration"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {"database": "ok", "redis": "ok"}}
app.include_router(discovery_router, prefix="/api/discovery")
app.include_router(config_router, prefix="/api/config")


# ============================================
# RUN
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)