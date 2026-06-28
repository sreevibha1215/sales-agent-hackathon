from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uuid
from agents.planner import PlannerAgent
from auth.dependencies import verify_token
router = APIRouter()
security = HTTPBearer()
from database.db import get_connection
import json

# In-memory run tracking
run_store = {}

class DiscoveryStart(BaseModel):
    workspace_id: str
    config: dict


def clean_recommendation(rec: dict) -> dict:
    """Ensure array fields are always arrays not strings"""
    array_fields = ['contacts', 'tech_stack', 'icp_reasons']
    for field in array_fields:
        val = rec.get(field)
        if not isinstance(val, list):
            rec[field] = []
    return rec

@router.post('/start')
async def start_discovery(data: DiscoveryStart, user=Depends(verify_token)):  # added this
    run_id = str(uuid.uuid4())
    
    run_store[run_id] = {'status': 'running', 'progress': 0}
    
    try:
        planner = PlannerAgent()
        result = await planner.run(
            workspace_id=data.workspace_id,
            config=data.config
        )
        
        cleaned_recommendations = [clean_recommendation(r) for r in result.get('recommendations', [])]
                # ✅ Save to database
        conn = get_connection()
        cur = conn.cursor()
        
        # Save each company
        for rec in cleaned_recommendations:
            cur.execute("""
                INSERT INTO companies (workspace_id, name, data, score, status)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                data.workspace_id,
                rec.get('company'),
                json.dumps(rec),          # full recommendation as JSON
                rec.get('intent_score', 0),
                'qualified'
            ))
        
        # Save discovery run
        cur.execute("""
            INSERT INTO results (workspace_id, agent_name, output)
            VALUES (%s, %s, %s)
        """, (
            data.workspace_id,
            'discovery_pipeline',
            json.dumps({
                'run_id': run_id,
                'summary': result.get('summary', {}),
                'recommendations': cleaned_recommendations
            })
        ))
        
        # Update workspace lead count
        cur.execute("""
            UPDATE workspaces 
            SET lead_count = %s 
            WHERE id = %s
        """, (len(cleaned_recommendations), data.workspace_id))
        
        conn.commit()
        cur.close()
        conn.close()
        

        run_store[run_id] = {
            'status': 'completed',
            'progress': 100,
            'summary': result.get('summary', {}),
            'recommendations': cleaned_recommendations,
        }
        
        return {
            'run_id': run_id,
            'status': 'completed',
            'workspace_id': data.workspace_id,
            'summary': result.get('summary', {}),
            'recommendations': cleaned_recommendations,
            'companies': result.get('companies', []),
            'qualified': result.get('qualified_companies', [])
        }

    except Exception as e:
        run_store[run_id] = {'status': 'failed', 'progress': 0, 'error': str(e)}
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/workspace/{workspace_id}')
async def get_workspace_results(workspace_id: str, user=Depends(verify_token)):
    conn = get_connection()
    cur = conn.cursor()
    
    # Get all companies for this workspace
    cur.execute("""
        SELECT id, name, data, score, status, created_at 
        FROM companies 
        WHERE workspace_id = %s 
        ORDER BY score DESC
    """, (workspace_id,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        'workspace_id': workspace_id,
        'companies': [
            {
                'id': r[0],
                'name': r[1],
                'data': r[2],
                'score': r[3],
                'status': r[4],
                'created_at': str(r[5])
            }
            for r in rows
        ]
    }


@router.get('/{run_id}/status')
async def get_discovery_status(run_id: str, user=Depends(verify_token)):  # protect this too
    if run_id not in run_store:
        raise HTTPException(status_code=404, detail="Run not found")
    return {'run_id': run_id, **run_store[run_id]}