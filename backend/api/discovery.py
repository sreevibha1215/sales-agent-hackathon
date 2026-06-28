from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from agents.planner import PlannerAgent

router = APIRouter()

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
async def start_discovery(data: DiscoveryStart):
    run_id = str(uuid.uuid4())
    
    # Mark as running
    run_store[run_id] = {'status': 'running', 'progress': 0}
    
    try:
        planner = PlannerAgent()
        result = await planner.run(
            workspace_id=data.workspace_id,
            config=data.config
        )
        
        cleaned_recommendations = [clean_recommendation(r) for r in result.get('recommendations', [])]
        
        # Mark as completed
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

@router.get('/{run_id}/status')
async def get_discovery_status(run_id: str):
    if run_id not in run_store:
        raise HTTPException(status_code=404, detail="Run not found")
    return {'run_id': run_id, **run_store[run_id]}