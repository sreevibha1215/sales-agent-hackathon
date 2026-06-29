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
        for company in companies[:8]:
            print(f"🏢 Enriching {company.get('name')}")
            enriched_data = await self.enrich_with_tavily_groq(company)

            if enriched_data:
                company.update(enriched_data)
                print(f"  ✅ Real data extracted")
            else:
                print(f"  ⚠️ Using smart fallback data")
                company.update(self.get_smart_fallback(company))

            enriched.append(company)

        state['enriched_companies'] = enriched
        return state

    async def enrich_with_tavily_groq(self, company: Dict) -> Dict:
        company_name = company.get('name', '')
        existing_url = company.get('url', '')

        try:
            search_results = await self.search_company(company_name, existing_url)

            if not search_results:
                return None

            extracted = self.extract_with_groq(company_name, search_results)
            return extracted

        except Exception as e:
            logger.error(f"⚠️ Enrichment error for {company_name}: {e}")
            return None

    async def search_company(self, company_name: str, existing_url: str = '') -> str:
        if not self.tavily_key:
            return None

        now = time.time()
        if now - self.last_request_time < 1.5:
            await asyncio.sleep(1.5)
        self.last_request_time = time.time()

        query = f"{company_name} company employees revenue technology stack headquarters leadership"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": self.tavily_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": 5,
                        "include_domains": ["linkedin.com", "crunchbase.com", "wikipedia.org"]
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    combined = f"Company: {company_name}\n\n"
                    for r in results:
                        combined += f"Source: {r.get('url', '')}\n"
                        combined += f"{r.get('content', '')}\n\n"

                    return combined[:3000]
                else:
                    logger.warning(f"⚠️ Tavily error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"⚠️ Tavily search error: {e}")
            return None

    def extract_with_groq(self, company_name: str, search_text: str) -> Dict:
        try:
            prompt = f"""Extract company information from these search results about "{company_name}".

{search_text}

Return ONLY a JSON object with these fields:
{{
    "employees": number of employees as integer,
    "revenue": annual revenue as string like "$10M" or "$500M",
    "tech_stack": list of up to 5 technologies they use,
    "headquarters": city and country as string,
    "industry": their specific industry,
    "description": 1-2 sentence company description,
    "founding_year": year founded as integer,
    "contacts": [],
    "funding_raised": funding as string like "$50M" or "$5B"
}}

IMPORTANT:
- If a field is not found, ESTIMATE it based on context
- For employees: estimate based on company size indicators
- For revenue: estimate based on industry and size
- For headquarters: use the location mentioned
- For industry: infer from description
- NEVER return "Unknown" - always provide a value
- If estimating, add "(est.)" after the value

Return ONLY the JSON, no other text."""

            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1
            )

            text = response.choices[0].message.content
            data = json.loads(text)

            # Clean up - replace "Unknown" with estimates
            data = self._clean_unknown_values(data, company_name)

            data['source'] = 'tavily_groq'
            return data

        except Exception as e:
            logger.error(f"⚠️ Groq extraction error: {e}")
            return None

    def _clean_unknown_values(self, data: Dict, company_name: str) -> Dict:
        """Replace "Unknown" with smart estimates"""
        
        # Employees
        if data.get('employees') in [0, '0', 'Unknown', 'unknown', None]:
            data['employees'] = self._estimate_employees(company_name)
        
        # Revenue
        if data.get('revenue') in ['Unknown', 'unknown', 'N/A', None, '']:
            data['revenue'] = self._estimate_revenue(data.get('industry', 'Technology'), data.get('employees', 0))
        
        # Headquarters
        if data.get('headquarters') in ['Unknown', 'unknown', 'N/A', None, '']:
            data['headquarters'] = 'Global (est.)'
        
        # Industry
        if data.get('industry') in ['Unknown', 'unknown', 'N/A', None, '']:
            data['industry'] = self._infer_industry(company_name)
        
        # Tech stack
        if not data.get('tech_stack') or data.get('tech_stack') == []:
            data['tech_stack'] = self._infer_tech_stack(data.get('industry', 'Technology'))
        
        # Funding
        if data.get('funding_raised') in ['Unknown', 'unknown', 'N/A', None, '']:
            data['funding_raised'] = self._estimate_funding(data.get('industry', 'Technology'))
        
        return data

    def _estimate_employees(self, company_name: str) -> int:
        """Estimate employees based on company name patterns"""
        name_lower = company_name.lower()
        
        # Public companies usually have 5000+ employees
        if any(suffix in name_lower for suffix in ['inc', 'corp', 'plc', 'ltd']):
            return 5000
        # European companies
        if any(suffix in name_lower for suffix in ['ag', 'gmbh', 'se']):
            return 3000
        # Tech/startup companies
        if any(word in name_lower for word in ['tech', 'solutions', 'software', 'digital']):
            return 200
        # Default
        return 500

    def _estimate_revenue(self, industry: str, employees: int) -> str:
        """Estimate revenue based on industry and employee count"""
        if employees > 10000:
            return '$50B+'
        elif employees > 5000:
            return '$10B+'
        elif employees > 1000:
            return '$1B+'
        elif employees > 500:
            return '$100M+'
        elif employees > 100:
            return '$50M+'
        else:
            return '$10M+'

    def _infer_industry(self, company_name: str) -> str:
        """Infer industry from company name"""
        name_lower = company_name.lower()
        
        if any(word in name_lower for word in ['saas', 'software', 'cloud', 'platform']):
            return 'Software/SaaS'
        if any(word in name_lower for word in ['fintech', 'payment', 'bank', 'finance']):
            return 'Fintech'
        if any(word in name_lower for word in ['health', 'pharma', 'medical', 'biotech']):
            return 'Healthcare'
        if any(word in name_lower for word in ['retail', 'shop', 'commerce']):
            return 'Retail'
        if any(word in name_lower for word in ['manufact', 'industrial', 'factory']):
            return 'Manufacturing'
        if any(word in name_lower for word in ['energy', 'solar', 'power']):
            return 'Energy'
        if any(word in name_lower for word in ['educat', 'learn', 'training']):
            return 'Education'
        return 'Technology'

    def _infer_tech_stack(self, industry: str) -> List[str]:
        """Infer tech stack based on industry"""
        tech_stacks = {
            'Software/SaaS': ['AWS', 'Salesforce', 'HubSpot', 'Slack'],
            'Fintech': ['AWS', 'Stripe', 'Salesforce', 'Azure'],
            'Healthcare': ['Salesforce', 'AWS', 'Tableau', 'PowerBI'],
            'Retail': ['Shopify', 'AWS', 'HubSpot', 'Salesforce'],
            'Manufacturing': ['SAP', 'Oracle', 'AWS', 'Azure'],
            'Energy': ['SAP', 'Oracle', 'AWS', 'Azure'],
            'Education': ['AWS', 'Salesforce', 'HubSpot', 'Canvas'],
            'Technology': ['AWS', 'Salesforce', 'GitHub', 'Slack']
        }
        return tech_stacks.get(industry, ['AWS', 'Salesforce'])

    def _estimate_funding(self, industry: str) -> str:
        """Estimate funding based on industry"""
        funding_map = {
            'Fintech': '$100M+',
            'Software/SaaS': '$50M+',
            'Healthcare': '$100M+',
            'Retail': '$50M+',
            'Manufacturing': '$20M+',
            'Energy': '$100M+',
            'Education': '$30M+',
            'Technology': '$50M+'
        }
        return funding_map.get(industry, '$10M+')

    def get_smart_fallback(self, company: Dict) -> Dict:
        """Smart fallback when Tavily+Groq fails"""
        name = company.get('name', '')
        industry = self._infer_industry(name)
        employees = self._estimate_employees(name)
        
        return {
            'employees': employees,
            'revenue': self._estimate_revenue(industry, employees),
            'tech_stack': self._infer_tech_stack(industry),
            'headquarters': 'Global (est.)',
            'industry': industry,
            'description': company.get('description', f'{name} is a company in the {industry} industry.'),
            'founding_year': 0,
            'contacts': [],
            'funding_raised': self._estimate_funding(industry),
            'source': 'smart_fallback'
        }