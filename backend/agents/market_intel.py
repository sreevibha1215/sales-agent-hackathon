from typing import Dict, Any, List
import os
import httpx
import logging
import asyncio
import time
import re
import json

from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketIntelAgent:
    def __init__(self):
        self.tavily_key = os.getenv('TAVILY_API_KEY')
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.last_request_time = 0
        logger.info(f"🔍 MarketIntelAgent initialized with Tavily key: {bool(self.tavily_key)}")

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        config = state.get('icp_config', {})
        industry = config.get('industry', 'SaaS')
        geography = config.get('geography', 'United States')

        # Step 1: Use Groq to generate real company names
        logger.info(f"🧠 Generating real {industry} company names in {geography}...")
        company_names = self._generate_company_names(industry, geography)
        logger.info(f"✅ Groq generated: {company_names}")

        # Step 2: Search Tavily for each company to get real data
        all_companies = []
        for name in company_names[:8]:
            logger.info(f"🔍 Looking up: {name}")
            results = await self.search_web(f"{name} company overview employees")
            if results:
                company = results[0]
                company['name'] = name  # override with known real name
                all_companies.append(company)
            else:
                all_companies.append({
                    'name': name,
                    'description': f'{industry} company in {geography}',
                    'source': 'groq_generated',
                    'relevance_score': 0.7
                })

        unique_companies = self.deduplicate(all_companies)
        state['companies'] = unique_companies[:15]
        logger.info(f"✅ Found {len(state['companies'])} companies")
        return state

    def _generate_company_names(self, industry: str, geography: str) -> List[str]:
        """Use Groq to generate real company names"""
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{
                    "role": "user",
                    "content": f"""List 10 real {industry} companies located in {geography}.
These must be real companies that actually exist right now.
Return ONLY a JSON object like this:
{{"companies": ["Company Name 1", "Company Name 2", "Company Name 3"]}}
No descriptions, no explanations, just the JSON."""
                }],
                response_format={"type": "json_object"},
                temperature=0.1
            )

            data = json.loads(response.choices[0].message.content)
            names = data.get('companies', [])
            return names

        except Exception as e:
            logger.error(f"⚠️ Groq company generation failed: {e}")
            return self.get_fallback_company_names(industry, geography)

    async def search_web(self, query: str) -> List[Dict]:
        """Real web search using Tavily API"""
        if not self.tavily_key:
            return []

        # Rate limiting
        now = time.time()
        if now - self.last_request_time < 1:
            await asyncio.sleep(1)
        self.last_request_time = time.time()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": self.tavily_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": 5,
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    companies = []
                    for result in results[:3]:
                        content = result.get('content', '')
                        url = result.get('url', '')
                        companies.append({
                            'name': '',
                            'description': content[:300],
                            'url': url,
                            'source': 'tavily',
                            'relevance_score': result.get('score', 0.5)
                        })

                    return companies[:1]
                else:
                    return []

        except Exception as e:
            logger.error(f"⚠️ Tavily exception: {e}")
            return []

    def deduplicate(self, companies: List[Dict]) -> List[Dict]:
        """Remove duplicate companies"""
        seen = set()
        unique = []
        for company in companies:
            name = company.get('name', '').lower().strip()
            if name and name not in seen:
                seen.add(name)
                unique.append(company)
        return unique

    def get_fallback_company_names(self, industry: str, geography: str) -> List[str]:
        """Fallback company names if Groq fails"""
        fallbacks = {
            'manufacturing': ['Siemens AG', 'Bosch GmbH', 'BASF SE',
                              'Thyssenkrupp AG', 'Schaeffler AG', 'Continental AG',
                              'Heidelberg Materials', 'Wacker Chemie AG'],
            'saas': ['Salesforce', 'HubSpot', 'Zendesk', 'Freshworks',
                     'Monday.com', 'Pipedrive', 'Intercom', 'Drift'],
            'fintech': ['Stripe', 'Revolut', 'N26', 'Klarna',
                        'Adyen', 'SumUp', 'Paysafe', 'Checkout.com'],
            'retail': ['Walmart', 'Amazon', 'Target', 'Costco',
                       'Home Depot', 'Kroger', 'Walgreens', 'CVS'],
            'healthcare': ['UnitedHealth', 'CVS Health', 'Fresenius SE',
                           'Siemens Healthineers', 'B Braun', 'Asklepios'],
            'energy': ['ExxonMobil', 'Chevron', 'Shell', 'BP',
                       'TotalEnergies', 'Equinor', 'Eni', 'Repsol'],
            'education': ['Coursera', 'Udemy', 'Duolingo', 'Chegg',
                          'Pearson', 'McGraw Hill', '2U', 'Instructure'],
        }
        industry_lower = industry.lower()
        for key in fallbacks:
            if key in industry_lower:
                return fallbacks[key]
        return fallbacks['saas']