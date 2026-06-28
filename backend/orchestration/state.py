from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    workspace_id: str
    config: Dict[str, Any]
    companies: List[Dict[str, Any]]
    qualified_companies: List[Dict[str, Any]]
    enriched_companies: List[Dict[str, Any]]
    contacts: List[Dict[str, Any]]
    scores: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    completed_agents: List[str]