from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.db import SessionLocal, Workspace
import uuid

router = APIRouter()

class WorkspaceCreate(BaseModel):
    title: str
    config: Optional[dict] = None

@router.post('/')
async def create_workspace(data: WorkspaceCreate):
    db = SessionLocal()
    workspace = Workspace(
        id=str(uuid.uuid4()),
        user_id='temp_user',
        title=data.title,
        config=data.config or {}
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    db.close()
    
    return {
        'id': workspace.id,
        'title': workspace.title,
        'created_at': workspace.created_at
    }

@router.get('/')
async def list_workspaces():
    db = SessionLocal()
    workspaces = db.query(Workspace).filter(Workspace.user_id == 'temp_user').all()
    db.close()
    
    return [
        {
            'id': w.id,
            'title': w.title,
            'lead_count': w.lead_count,
            'created_at': w.created_at
        }
        for w in workspaces
    ]

@router.get('/{workspace_id}')
async def get_workspace(workspace_id: str):
    db = SessionLocal()
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    db.close()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    return {
        'id': workspace.id,
        'title': workspace.title,
        'config': workspace.config,
        'lead_count': workspace.lead_count,
        'created_at': workspace.created_at
    }