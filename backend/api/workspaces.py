from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database.db import get_connection
from auth.dependencies import verify_token
import uuid

router = APIRouter()

class WorkspaceCreate(BaseModel):
    name: str
    config: Optional[dict] = None

@router.post('/')
async def create_workspace(data: WorkspaceCreate, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    workspace_id = str(uuid.uuid4())
    user_id = user.get('sub', 'temp_user')
    
    cur.execute(
        "INSERT INTO workspaces (id, user_id, name, config) VALUES (%s, %s, %s, %s) RETURNING id, name, created_at",
        (workspace_id, user_id, data.name, json.dumps(data.config or {}))
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "name": row[1], "created_at": str(row[2])}

@router.get('/')
async def list_workspaces(user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get('sub', 'temp_user')
    
    cur.execute(
        "SELECT id, name, lead_count, created_at FROM workspaces WHERE user_id = %s",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1], "lead_count": r[2], "created_at": str(r[3])} for r in rows]

@router.get('/{workspace_id}')
async def get_workspace(workspace_id: str, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = user.get('sub', 'temp_user')
    
    cur.execute(
        "SELECT id, name, config, lead_count, created_at FROM workspaces WHERE id = %s AND user_id = %s",
        (workspace_id, user_id)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"id": row[0], "name": row[1], "config": row[2], "lead_count": row[3], "created_at": str(row[4])}