import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from backend.auth.auth import signup_user, login_user, logout_user, get_current_user
from backend.tools.gemini_tool import extract_config
from backend.database.db import get_connection

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

class WorkspaceCreate(BaseModel):
    name: str

class CompanyAdd(BaseModel):
    name: str
class DiscoverRequest(BaseModel):
    workspace_id: int
    companies: list[str]

# ---------- Helper ----------
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    result = get_current_user(credentials.credentials)
    if not result["success"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    return result["user"]

# ---------- Auth Routes ----------
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

# ---------- Config Extract ----------
@app.post("/api/config/extract")
async def config_extract(req: ConfigExtractRequest, user=Depends(verify_token)):
    result = extract_config(req.text)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return result["config"]

# ---------- Workspace Routes ----------
@app.post("/api/workspaces")
async def create_workspace(req: WorkspaceCreate, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get("sub", "unknown")
    cur.execute(
        "INSERT INTO workspaces (user_id, name) VALUES (%s, %s) RETURNING id, name, created_at",
        (user_id, req.name)
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
    user_id = user.get("sub", "unknown")
    cur.execute(
        "SELECT id, name, created_at FROM workspaces WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1], "created_at": str(r[2])} for r in rows]

@app.get("/api/workspaces/{workspace_id}")
async def get_workspace(workspace_id: int, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, config, created_at FROM workspaces WHERE id = %s", (workspace_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"id": row[0], "name": row[1], "config": row[2], "created_at": str(row[3])}

@app.delete("/api/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: int, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    # Delete companies first, then workspace
    cur.execute("DELETE FROM companies WHERE workspace_id = %s", (workspace_id,))
    cur.execute("DELETE FROM workspaces WHERE id = %s", (workspace_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Workspace deleted"}

# ---------- Company Routes ----------
@app.post("/api/workspaces/{workspace_id}/companies")
async def add_company(workspace_id: int, req: CompanyAdd, user=Depends(verify_token)):
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
async def list_companies(workspace_id: int, user=Depends(verify_token)):
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

@app.get("/")
async def root():
    return {"message": "Sales Agent API running ✅"}

@app.post("/api/discover")
async def discover(req: DiscoverRequest, user=Depends(verify_token)):
    """Run discovery on list of companies - uses real Tavily search"""
    from backend.tools.search_tool import search_company
    from backend.memory.redis_client import save_to_memory, get_from_memory
    
    results = []
    
    for company_name in req.companies:
        # Check Redis cache first
        cached = get_from_memory(str(req.workspace_id), company_name)
        if cached["success"] and cached["data"]:
            results.append(cached["data"])
            continue
        
        # Search via Tavily
        search_result = search_company(company_name)
        
        if search_result["success"] and search_result["results"]:
            top = search_result["results"][0]
            company_data = {
                "name": company_name,
                "summary": top["content"][:300],
                "url": top["url"],
                "score": round(top["score"] * 100, 1),
                "status": "discovered"
            }
        else:
            company_data = {
                "name": company_name,
                "summary": "No data found",
                "url": "",
                "score": 0,
                "status": "failed"
            }
        
        # Save to Redis memory
        save_to_memory(str(req.workspace_id), company_name, company_data)
        
        # Update DB score
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE companies SET score = %s, status = %s WHERE workspace_id = %s AND name = %s",
            (company_data["score"], company_data["status"], req.workspace_id, company_name)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        results.append(company_data)
    
    return {"workspace_id": req.workspace_id, "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)