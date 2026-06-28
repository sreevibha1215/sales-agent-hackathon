from typing import Dict, Any

class BuyingIntentAgent:
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        companies = state.get('enriched_companies', [])
        
        scored_companies = []
        for company in companies:
            score = self._calculate_intent_score(company)
            scored_companies.append({
                **company,
                'intent_score': score,
                'reasoning': self._generate_reasoning(company, score)
            })
        
        state['scores'] = scored_companies
        return state
    
    def _parse_number(self, value) -> float:
        """Safely convert any value to a number"""
        if value is None:
            return 0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove $, M, B, K, commas, spaces
            clean = value.replace('$', '').replace(',', '').replace(' ', '').upper()
            try:
                if clean.endswith('B'):
                    return float(clean[:-1]) * 1000
                elif clean.endswith('M'):
                    return float(clean[:-1])
                elif clean.endswith('K'):
                    return float(clean[:-1]) / 1000
                elif clean == 'UNKNOWN' or clean == '':
                    return 0
                else:
                    return float(clean)
            except:
                return 0
        return 0

    def _calculate_intent_score(self, company: Dict) -> int:
        score = 0
        config = company.get('icp_config', {})

        # Funding signals (30%)
        funding = self._parse_number(company.get('funding_raised', 0))
        if funding > 10:
            score += 30
        elif funding > 0:
            score += 15

        # Company size match (25%)
        employees = self._parse_number(company.get('employees', 0))
        if employees > 0:
            score += 20  # has employee data = real company
            if 50 <= employees <= 1000:
                score += 5  # bonus for ideal size

        # Tech stack match (25%)
        tech_stack = company.get('tech_stack', [])
        if isinstance(tech_stack, list) and len(tech_stack) > 0:
            score += 10  # has tech data
            target_tech = ['SAP', 'Oracle', 'Salesforce', 'AWS', 'Azure', 
                          'HubSpot', 'Workday', 'ServiceNow']
            matches = sum(1 for t in tech_stack if any(tt.lower() in t.lower() for tt in target_tech))
            score += min(matches * 5, 15)

        # Has real contacts from enrichment (20%)
        contacts = company.get('contacts', [])
        if isinstance(contacts, list) and len(contacts) > 0:
            score+=10 + min(len(contacts) * 2, 20)

        # ICP score bonus
        icp_score = self._parse_number(company.get('icp_score', 0))
        score += int(icp_score * 10)

        return min(score, 100)
    
    def _generate_reasoning(self, company: Dict, score: int) -> str:
        reasons = []
        
        funding = self._parse_number(company.get('funding_raised', 0))
        if funding > 10:
            reasons.append(f"Raised {company.get('funding_raised', 'significant')} funding")
        
        employees = self._parse_number(company.get('employees', 0))
        if employees > 0:
            reasons.append(f"{int(employees)} employees")
        
        tech_stack = company.get('tech_stack', [])
        if isinstance(tech_stack, list) and len(tech_stack) > 0:
            reasons.append(f"Uses {', '.join(tech_stack[:3])}")
        
        contacts = company.get('contacts', [])
        if isinstance(contacts, list) and len(contacts) > 0:
            reasons.append(f"{len(contacts)} decision-maker(s) identified")

        icp_score = company.get('icp_score', 0)
        if icp_score:
            reasons.append(f"ICP score: {icp_score}")

        return f"{score}% match — " + " | ".join(reasons) if reasons else f"{score}% — Good fit based on ICP"