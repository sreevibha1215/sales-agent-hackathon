# backend/orchestration/graph.py

from typing import Dict, Any, List, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt

from agents.market_intel import MarketIntelAgent
from agents.icp_qualifier import ICPQualifierAgent
from agents.company_intel import CompanyIntelAgent
from agents.contact_intel import ContactIntelAgent
from agents.buying_intent import BuyingIntentAgent
from agents.recommendation import RecommendationAgent
from typing import Dict, Any, List, TypedDict, Literal
from langgraph.graph import StateGraph, END




# 1. Define State
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
    error: str
    status: str

# 2. Initialize Agents
agents = {
    'market_intel': MarketIntelAgent(),
    'icp_qualifier': ICPQualifierAgent(),
    'company_intel': CompanyIntelAgent(),
    'contact_intel': ContactIntelAgent(),
    'buying_intent': BuyingIntentAgent(),
    'recommendation': RecommendationAgent()
}

# 3. Node Functions
async def market_intel_node(state: AgentState) -> AgentState:
    print("🔍 Running Market Intelligence...")
    result = await agents['market_intel'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['market_intel']
    return state

async def icp_qualifier_node(state: AgentState) -> AgentState:
    print("🎯 Running ICP Qualification...")
    result = await agents['icp_qualifier'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['icp_qualifier']
    return state

async def company_intel_node(state: AgentState) -> AgentState:
    print("🏢 Running Company Intelligence...")
    result = await agents['company_intel'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['company_intel']
    return state

async def contact_intel_node(state: AgentState) -> AgentState:
    print("👤 Running Contact Intelligence...")
    result = await agents['contact_intel'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['contact_intel']
    return state

async def buying_intent_node(state: AgentState) -> AgentState:
    print("📊 Running Buying Intent...")
    result = await agents['buying_intent'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['buying_intent']
    return state

async def human_approval_node(state: AgentState) -> AgentState:
    print("👤 Human Approval Checkpoint...")
    # For demo, auto-approve (can be modified for real approval)
    state['approved'] = True
    return state

async def recommendation_node(state: AgentState) -> AgentState:
    print("📋 Running Recommendation...")
    result = await agents['recommendation'].run(state)
    state.update(result)
    state['completed_agents'] = state.get('completed_agents', []) + ['recommendation']
    return state

# 4. Routing Logic
def route_after_market_intel(state: AgentState) -> Literal["icp_qualifier", "end"]:
    if not state.get('companies'):
        print("❌ No companies found - stopping early")
        return "end"
    print(f"✅ Found {len(state['companies'])} companies")
    return "icp_qualifier"

def route_after_icp(state: AgentState) -> Literal["company_intel", "end"]:
    if not state.get('qualified_companies'):
        print("❌ No qualified companies - stopping early")
        return "end"
    print(f"✅ {len(state['qualified_companies'])} companies qualified")
    return "company_intel"

def route_after_company(state: AgentState) -> Literal["contact_intel", "end"]:
    if not state.get('enriched_companies'):
        print("❌ No enriched companies - stopping early")
        return "end"
    print(f"✅ {len(state['enriched_companies'])} companies enriched")
    return "contact_intel"

def route_after_contact(state: AgentState) -> Literal["buying_intent", "end"]:
    if not state.get('contacts'):
        print("⚠️ No contacts found - continuing with intent scoring")
    else:
        print(f"✅ {len(state['contacts'])} contacts found")
    return "buying_intent"

def route_after_buying(state: AgentState) -> Literal["human_approval", "end"]:
    if not state.get('scores'):
        print("❌ No scores - stopping")
        return "end"
    print(f"✅ {len(state['scores'])} companies scored")
    return "human_approval"

def route_after_approval(state: AgentState) -> Literal["recommendation", "end"]:
    if state.get('approved', False):
        return "recommendation"
    print("❌ Not approved - stopping")
    return "end"

# 5. Build Graph
def build_discovery_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("market_intel", market_intel_node)
    workflow.add_node("icp_qualifier", icp_qualifier_node)
    workflow.add_node("company_intel", company_intel_node)
    workflow.add_node("contact_intel", contact_intel_node)
    workflow.add_node("buying_intent", buying_intent_node)
    workflow.add_node("human_approval", human_approval_node)
    workflow.add_node("recommendation", recommendation_node)
    
    # Set entry point
    workflow.set_entry_point("market_intel")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "market_intel",
        route_after_market_intel,
        {"icp_qualifier": "icp_qualifier", "end": END}
    )
    
    workflow.add_conditional_edges(
        "icp_qualifier",
        route_after_icp,
        {"company_intel": "company_intel", "end": END}
    )
    
    workflow.add_conditional_edges(
        "company_intel",
        route_after_company,
        {"contact_intel": "contact_intel", "end": END}
    )
    
    workflow.add_conditional_edges(
        "contact_intel",
        route_after_contact,
        {"buying_intent": "buying_intent", "end": END}
    )
    
    workflow.add_conditional_edges(
        "buying_intent",
        route_after_buying,
        {"human_approval": "human_approval", "end": END}
    )
    
    workflow.add_conditional_edges(
        "human_approval",
        route_after_approval,
        {"recommendation": "recommendation", "end": END}
    )
    
    workflow.add_edge("recommendation", END)
    
    return workflow.compile(checkpointer=MemorySaver())

# 6. Orchestrator
class DiscoveryOrchestrator:
    def __init__(self):
        self.graph = build_discovery_graph()
        print("✅ LangGraph Discovery Orchestrator initialized")
    
    async def run(self, workspace_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        initial_state = {
            "workspace_id": workspace_id,
            "config": config,
            "companies": [],
            "qualified_companies": [],
            "enriched_companies": [],
            "contacts": [],
            "scores": [],
            "recommendations": [],
            "completed_agents": [],
            "error": "",
            "status": "running",
            "approved": False
        }
        
        try:
            final_state = await self.graph.ainvoke(
                initial_state,
                config={"configurable": {"thread_id": f"thread_{workspace_id}"}}
            )
            
            return {
                "status": "completed",
                "companies": final_state.get('companies', []),
                "qualified_companies": final_state.get('qualified_companies', []),
                "contacts": final_state.get('contacts', []),
                "recommendations": final_state.get('recommendations', []),
                "summary": final_state.get('summary', {}),
                "completed_agents": final_state.get('completed_agents', [])
            }
            
        except Exception as e:
            print(f"❌ Workflow error: {e}")
            return {"status": "failed", "error": str(e)}