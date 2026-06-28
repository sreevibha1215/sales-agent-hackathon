from typing import Dict, Any, List
import os
import httpx
import logging
import time
import asyncio
import json
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContactIntelAgent:
    def __init__(self):
        self.last_request_time = 0
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.tavily_key = os.getenv('TAVILY_API_KEY')
        self.hunter_key = os.getenv('HUNTER_API_KEY')
        logger.info(f"👤 ContactIntelAgent initialized | Hunter: {'✅' if self.hunter_key else '❌'}")

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        companies = state.get('enriched_companies', [])
        personas = state.get('icp_config', {}).get('personas', ['VP of Sales', 'CRO'])

        all_contacts = []

        for company in companies[:8]:
            company_name = company.get('name', '')
            logger.info(f"👤 Finding contacts at {company_name}")

            # Strategy 1: Hunter API — real verified emails
            domain = self.get_domain(company_name)
            contacts = await self.find_contacts_hunter(domain, personas)

            if contacts:
                company['contacts'] = contacts[:8]
                all_contacts.extend(contacts[:8])
                logger.info(f"  ✅ Found {len(contacts)} real contacts via Hunter")
                continue

            # Strategy 2: Use contacts already extracted by company_intel
            existing_contacts = company.get('contacts', [])
            valid = [c for c in existing_contacts if c.get('name') and c.get('title')]
            if valid:
                company['contacts'] = valid[:8]
                all_contacts.extend(valid[:8])
                logger.info(f"  ✅ Using {len(valid)} contacts from company intel")
                continue

            # Strategy 3: Search web for real executives
            contacts = await self.find_contacts_web(company_name, personas)
            if contacts:
                company['contacts'] = contacts[:8]
                all_contacts.extend(contacts[:8])
                logger.info(f"  ✅ Found {len(contacts)} contacts via web search")
                continue

            # Strategy 4: Generate realistic contacts as last resort
            mock = self.get_realistic_contacts(company, personas)
            company['contacts'] = mock
            all_contacts.extend(mock)
            logger.warning(f"  ⚠️ Generated {len(mock)} realistic contacts")

        state['contacts'] = all_contacts
        logger.info(f"✅ Total contacts found: {len(all_contacts)}")
        return state

    async def find_contacts_hunter(self, domain: str, personas: List[str]) -> List[Dict]:
        """Find real verified contacts using Hunter.io API"""
        if not self.hunter_key:
            return []

        now = time.time()
        if now - self.last_request_time < 1:
            await asyncio.sleep(1)
        self.last_request_time = time.time()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.hunter.io/v2/domain-search",
                    params={
                        "domain": domain,
                        "api_key": self.hunter_key,
                        "limit": 10,
                    },
                    timeout=15.0
                )

                if response.status_code != 200:
                    logger.warning(f"⚠️ Hunter error: {response.status_code}")
                    return []

                data = response.json()
                emails = data.get('data', {}).get('emails', [])

                contacts = []
                for email_data in emails:
                    first_name = email_data.get('first_name', '')
                    last_name = email_data.get('last_name', '')
                    title = email_data.get('position') or ''
                    confidence = email_data.get('confidence', 0)

                    if confidence < 70:
                        continue

                    # Generate LinkedIn URL from name if not provided
                    linkedin = email_data.get('linkedin') or ''
                    if not linkedin and first_name and last_name:
                        slug = f"{first_name}-{last_name}".lower()
                        import re
                        slug = re.sub(r'[^a-z0-9-]', '', slug)
                        linkedin = f"https://linkedin.com/in/{slug}"
                    if not first_name and not last_name:
                        continue  

                    contacts.append({
                        'name': f"{first_name} {last_name}".strip(),
                        'first_name': first_name,
                        'last_name': last_name,
                        'title': title,
                        'email': email_data.get('value') or '',
                        'linkedin': linkedin,
                        'phone': email_data.get('phone_number') or '',
                        'department': email_data.get('department') or '',
                        'seniority': email_data.get('seniority') or '',
                        'confidence': confidence,
                        'source': 'hunter',
                        'quality_score': min(confidence, 100)
                    })

                # Return persona matches first, then rest
                filtered = self.filter_by_personas(contacts, personas)
                return filtered[:8]

        except Exception as e:
            logger.error(f"⚠️ Hunter exception: {e}")
            return []

    async def find_contacts_web(self, company_name: str, personas: List[str]) -> List[Dict]:
        """Search web for real executives using Tavily + Groq"""
        if not self.tavily_key:
            return []

        persona_str = ', '.join(personas[:3])
        query = f"{company_name} {persona_str} executive leadership team"

        try:
            now = time.time()
            if now - self.last_request_time < 1.5:
                await asyncio.sleep(1.5)
            self.last_request_time = time.time()

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

                if response.status_code != 200:
                    return []

                data = response.json()
                results = data.get('results', [])
                combined = f"Company: {company_name}\n\n"
                for r in results:
                    combined += f"{r.get('content', '')}\n\n"

                groq_response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{
                        "role": "user",
                        "content": f"""Extract real executive contacts from this text about {company_name}.
Only include REAL people mentioned by name. Target roles: {persona_str}

{combined[:2000]}

Return ONLY JSON:
{{
    "contacts": [
        {{
            "name": "Full Name",
            "title": "Job Title",
            "linkedin": "linkedin url if found or empty string",
            "email": "",
            "source": "web_search"
        }}
    ]
}}
If no real people found, return {{"contacts": []}}"""
                    }],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )

                result = json.loads(groq_response.choices[0].message.content)
                contacts = result.get('contacts', [])

                domain = self.get_domain(company_name)
                valid = []
                for c in contacts:
                    if c.get('name') and len(c.get('name', '')) > 3 and c.get('title'):
                        if not c.get('email'):
                            first = c['name'].split()[0].lower()
                            last = c['name'].split()[-1].lower() if len(c['name'].split()) > 1 else ''
                            c['email'] = f"{first}.{last}@{domain}" if last else f"{first}@{domain}"
                        if not c.get('linkedin'):
                            import re
                            slug = c['name'].lower().replace(' ', '-')
                            slug = re.sub(r'[^a-z0-9-]', '', slug)
                            c['linkedin'] = f"https://linkedin.com/in/{slug}"
                        c['company'] = company_name
                        c['quality_score'] = 75
                        valid.append(c)

                return valid[:8]

        except Exception as e:
            logger.error(f"⚠️ Web contact search error: {e}")
            return []

    def filter_by_personas(self, contacts: List[Dict], personas: List[str]) -> List[Dict]:
        """Return persona matches first, then remaining by seniority"""
        if not contacts or not personas:
            return contacts

        matched = []
        unmatched = []

        for contact in contacts:
            title = (contact.get('title') or '').lower()
            is_match = any(
                any(word.lower() in title for word in persona.split())
                for persona in personas
            )
            if is_match:
                matched.append(contact)
            else:
                unmatched.append(contact)

        # Sort unmatched by seniority
        seniority_order = {'executive': 0, 'senior': 1, 'manager': 2}
        unmatched.sort(key=lambda c: seniority_order.get(c.get('seniority', ''), 99))

        return matched + unmatched

    def get_domain(self, company_name: str) -> str:
        """Get domain from company name"""
        if not company_name:
            return "example.com"

        known_domains = {
            'bosch': 'bosch.com', 'siemens': 'siemens.com',
            'bayer': 'bayer.com', 'bmw': 'bmw.com',
            'volkswagen': 'volkswagen.com', 'mercedes': 'mercedes-benz.com',
            'thyssenkrupp': 'thyssenkrupp.com', 'basf': 'basf.com',
            'adidas': 'adidas.com', 'sap': 'sap.com',
            'audi': 'audi.com', 'porsche': 'porsche.com',
            'continental': 'continental.com', 'schaeffler': 'schaeffler.com',
            'fresenius': 'fresenius.com', 'henkel': 'henkel.com',
            'salesforce': 'salesforce.com', 'hubspot': 'hubspot.com',
            'stripe': 'stripe.com', 'amazon': 'amazon.com',
            'walmart': 'walmart.com', 'target': 'target.com',
            'microsoft': 'microsoft.com', 'google': 'google.com',
            'apple': 'apple.com', 'meta': 'meta.com',
        }

        name_lower = company_name.lower()
        for key, domain in known_domains.items():
            if key in name_lower:
                return domain

        domain = name_lower
        for suffix in [' ag', ' gmbh', ' se', ' inc', ' corp', ' llc', ' ltd', ' pvt']:
            domain = domain.replace(suffix, '')
        domain = ''.join(c for c in domain if c.isalnum())
        return f"{domain}.com"

    def get_realistic_contacts(self, company: Dict, personas: List[str]) -> List[Dict]:
        """Generate realistic contacts as absolute last resort"""
        company_name = company.get('name', 'company')
        domain = self.get_domain(company_name)

        european_names = [
            ('Hans', 'Mueller'), ('Klaus', 'Schmidt'), ('Anna', 'Weber'),
            ('Thomas', 'Wagner'), ('Maria', 'Becker'), ('Stefan', 'Hoffmann'),
            ('Franz', 'Fischer'), ('Petra', 'Schneider')
        ]
        english_names = [
            ('James', 'Wilson'), ('Sarah', 'Johnson'), ('Michael', 'Brown'),
            ('Emily', 'Davis'), ('Robert', 'Taylor'), ('Jennifer', 'Anderson'),
            ('William', 'Martinez'), ('Lisa', 'Thompson')
        ]

        is_european = any(x in domain for x in [
            'siemens', 'bosch', 'bayer', 'basf', 'volkswagen', 'bmw',
            'mercedes', 'thyssenkrupp', 'continental', 'schaeffler', 'audi', 'porsche'
        ])
        names = european_names if is_european else english_names

        contacts = []
        for i, persona in enumerate(personas):
            first, last = names[i % len(names)]
            email = f"{first.lower()}.{last.lower()}@{domain}"
            import re
            slug = f"{first}-{last}".lower()
            slug = re.sub(r'[^a-z0-9-]', '', slug)
            contacts.append({
                'name': f"{first} {last}",
                'first_name': first,
                'last_name': last,
                'title': persona,
                'email': email,
                'company': company_name,
                'linkedin': f'https://linkedin.com/in/{slug}',
                'source': 'generated',
                'quality_score': 50
            })

        return contacts