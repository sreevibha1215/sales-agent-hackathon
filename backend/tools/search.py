import httpx
import os

class SearchTool:
    def __init__(self):
        self.api_key = os.getenv('TAVILY_API_KEY', '')
    
    async def search_companies(self, query: str) -> list:
        """Search for companies using Tavily"""
        if not self.api_key:
            # Return mock data if no API key
            return [
                {"title": "Mock Company 1", "content": "Mock description"},
                {"title": "Mock Company 2", "content": "Mock description"}
            ]
        
        # TODO: Implement Tavily API call
        return []