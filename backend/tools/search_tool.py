import os
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def search_company(company_name: str) -> dict:
    """Search for company information using Tavily"""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=TAVILY_API_KEY)
        
        result = client.search(
            query=f"{company_name} company overview funding revenue employees",
            search_depth="advanced",
            max_results=5
        )
        return {"success": True, "results": result["results"]}
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_market(query: str) -> dict:
    """Search for market/industry information"""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=TAVILY_API_KEY)
        
        result = client.search(
            query=query,
            search_depth="basic",
            max_results=3
        )
        return {"success": True, "results": result["results"]}
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_contacts(company_name: str, role: str = "CEO") -> dict:
    """Search for key contacts at a company"""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=TAVILY_API_KEY)
        
        result = client.search(
            query=f"{company_name} {role} LinkedIn contact email",
            search_depth="basic",
            max_results=3
        )
        return {"success": True, "results": result["results"]}
    except Exception as e:
        return {"success": False, "error": str(e)}