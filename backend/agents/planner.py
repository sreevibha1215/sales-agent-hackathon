# backend/agents/planner.py

from typing import Dict, Any
from orchestration.graph import DiscoveryOrchestrator

class PlannerAgent:
    def __init__(self):
        self.orchestrator = DiscoveryOrchestrator()
    
    async def run(self, workspace_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        print(f"🚀 Starting LangGraph discovery for workspace: {workspace_id}")
        result = await self.orchestrator.run(workspace_id, config)
        print(f"✅ Discovery completed with status: {result.get('status')}")
        return result