from typing import Dict, Any, List
import os
import httpx
import json
import asyncio
import time
import logging

from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompanyIntelAgent:
    def __init__(self):
        self.tavily_key = os.getenv('TAVILY_API_KEY')
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.last_request_time = 0
        logger.info("🏢 CompanyIntelAgent initialized with Tavily + Groq")

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        companies = state.get('qualified_companies', [])

        enriched = []
        for company in companies[:8]:  # limit to 8 to save API calls
            print(f"🏢 Enriching {company.get('name')}")
            enriched_data = await self.enrich_with_tavily_groq(company)

            if enriched_data:
                company.update(enriched_data)
                print(f"  ✅ Real data extracted")
            else:
                print(f"  ⚠️ Using fallback data")
                company.update(self.get_fallback_enrichment(company))

            enriched.append(company)

        state['enriched_companies'] = enriched
        return state

    async def enrich_with_tavily_groq(self, company: Dict) -> Dict:
        """Search web for company info then extract structured data with Groq"""
        company_name = company.get('name', '')
        existing_url = company.get('url', '')

        try:
            # Step 1: Search Tavily for company info
            search_results = await self.search_company(company_name, existing_url)

            if not search_results:
                return None

            # Step 2: Feed to Groq to extract structured data
            extracted = self.extract_with_groq(company_name, search_results)
            return extracted

        except Exception as e:
            logger.error(f"⚠️ Enrichment error for {company_name}: {e}")
            return None

    async def search_company(self, company_name: str, existing_url: str = '') -> str:
        """Search Tavily for company details"""
        if not self.tavily_key:
            return None

        # Rate limiting
        now = time.time()
        if now - self.last_request_time < 1.5:
            await asyncio.sleep(1.5)
        self.last_request_time = time.time()

        query = f"{company_name} company employees revenue technology stack leadership team"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": self.tavily_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": 5
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    # Combine all result content into one text block
                    combined = f"Company: {company_name}\n\n"
                    for r in results:
                        combined += f"Source: {r.get('url', '')}\n"
                        combined += f"{r.get('content', '')}\n\n"

                    return combined[:3000]  # limit tokens sent to Groq
                else:
                    logger.warning(f"⚠️ Tavily error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"⚠️ Tavily search error: {e}")
            return None

    def extract_with_groq(self, company_name: str, search_text: str) -> Dict:
        """Use Groq to extract structured company data from search results"""
        try:
            prompt = f"""Extract company information from these search results about "{company_name}".

{search_text}

Return ONLY a JSON object with these fields:
{{
    "employees": estimated number of employees as integer (0 if unknown),
    "revenue": estimated annual revenue as string like "$10M" or "Unknown",
    "tech_stack": list of up to 5 technologies they use,
    "headquarters": city and country as string,
    "industry": their specific industry,
    "description": 1-2 sentence company description,
    "founding_year": year founded as integer (0 if unknown),
    "contacts": [
        {{
            "name": "real person name found in search results",
            "title": "their job title",
            "linkedin": "linkedin url if found"
        }}
    ],
    "funding_raised": estimated funding as string like "$50M" or "Unknown",
    "source": "tavily_groq"
}}

For contacts, only include REAL people mentioned by name in the search results.
If no real people found, return empty contacts array.
Return ONLY the JSON, no other text."""

            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1
            )

            text = response.choices[0].message.content
            data = json.loads(text)

            # Ensure all fields exist
            data.setdefault('employees', 0)
            data.setdefault('revenue', 'Unknown')
            data.setdefault('tech_stack', [])
            data.setdefault('headquarters', 'Unknown')
            data.setdefault('industry', 'Unknown')
            data.setdefault('description', '')
            data.setdefault('founding_year', 0)
            data.setdefault('contacts', [])
            data.setdefault('funding_raised', 'Unknown')
            data['source'] = 'tavily_groq'

            return data

        except Exception as e:
            logger.error(f"⚠️ Groq extraction error: {e}")
            return None

    def get_fallback_enrichment(self, company: Dict) -> Dict:
        """Fallback only when both Tavily and Groq fail"""
        name = company.get('name', '')
        return {
            'employees': 0,
            'revenue': 'Unknown',
            'tech_stack': [],
            'headquarters': 'Unknown',
            'industry': 'Unknown',
            'description': company.get('description', ''),
            'founding_year': 0,
            'contacts': [],
            'funding_raised': 'Unknown',
            'source': 'fallback'
        }