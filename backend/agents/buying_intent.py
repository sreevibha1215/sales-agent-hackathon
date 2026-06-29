from typing import Dict, Any

class BuyingIntentAgent:
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        companies = state.get('enriched_companies', [])
        
        scored_companies = []
        for company in companies:
            score, details = self._calculate_intent_score(company)
            scored_companies.append({
                **company,
                'intent_score': score,
                'reasoning': self._generate_reasoning(company, score, details)
            })
        
        state['scores'] = scored_companies
        return state
    
    def _parse_number(self, value) -> float:
        if value is None:
            return 0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
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

    def _calculate_intent_score(self, company: Dict) -> tuple:
        score = 0
        details = {}
        config = company.get('icp_config', {})

        # --- 1. Funding (up to 25) ---
        funding = self._parse_number(company.get('funding_raised', 0))
        if funding > 100:
            score += 25
            details['funding'] = 'High'
        elif funding > 20:
            score += 18
            details['funding'] = 'Medium'
        elif funding > 0:
            score += 10
            details['funding'] = 'Low'
        else:
            details['funding'] = 'Unknown'

        # --- 2. Employee size match (up to 20) ---
        employees = self._parse_number(company.get('employees', 0))
        min_emp = config.get('min_employees', 50)
        max_emp = config.get('max_employees', 500)
        
        if employees > 0:
            if min_emp <= employees <= max_emp:
                score += 20
                details['size'] = 'Ideal'
            elif employees < min_emp:
                score += 10
                details['size'] = 'Below ICP'
            elif employees > max_emp:
                score += 8
                details['size'] = 'Above ICP'
        else:
            details['size'] = 'Unknown'

        # --- 3. Revenue signal (up to 15) ---
        revenue = self._parse_number(company.get('revenue', 0))
        if revenue > 100:
            score += 15
            details['revenue'] = 'High'
        elif revenue > 10:
            score += 10
            details['revenue'] = 'Medium'
        elif revenue > 0:
            score += 5
            details['revenue'] = 'Low'
        else:
            details['revenue'] = 'Unknown'

        # --- 4. Tech stack match (up to 15) ---
        tech_stack = company.get('tech_stack', [])
        target_tech = config.get('tech_stack', [])
        if isinstance(tech_stack, list) and len(tech_stack) > 0:
            score += 5
            if target_tech:
                matches = sum(1 for t in tech_stack if any(tt.lower() in t.lower() for tt in target_tech))
                score += min(matches * 3, 10)
                details['tech'] = f'{matches}/{len(target_tech)} matches'
        else:
            details['tech'] = 'Unknown'

        # --- 5. Contacts (up to 15) ---
        contacts = company.get('contacts', [])
        real_contacts = [c for c in contacts if c.get('source') in ['hunter', 'apollo']]
        if real_contacts:
            score += min(len(real_contacts) * 3, 15)
            details['contacts'] = f'{len(real_contacts)} real'
        elif contacts:
            score += min(len(contacts) * 2, 10)
            details['contacts'] = f'{len(contacts)} generated'

        # --- 6. ICP bonus (up to 10) ---
        icp_score = self._parse_number(company.get('icp_score', 0))
        score += int(icp_score * 10)
        details['icp_score'] = f'{icp_score:.2f}'

        # --- 7. Data completeness bonus (up to 10) ---
        # This rewards companies with more complete data
        fields = ['employees', 'revenue', 'funding_raised', 'tech_stack']
        present = sum(1 for f in fields if company.get(f) and company.get(f) not in ['Unknown', 'N/A', 0, None])
        completeness_bonus = min(present * 2.5, 10)
        score += completeness_bonus
        details['data_quality'] = f'{present}/4 fields filled'

        return min(score, 100), details

    def _generate_reasoning(self, company: Dict, score: int, details: Dict) -> str:
        parts = []

        # Funding
        funding = self._parse_number(company.get('funding_raised', 0))
        if funding > 0:
            parts.append(f"Raised {company.get('funding_raised', 'significant')}")
        else:
            parts.append("Funding unknown")

        # Employees
        employees = self._parse_number(company.get('employees', 0))
        config = company.get('icp_config', {})
        if employees > 0:
            parts.append(f"{int(employees)} employees")
        else:
            parts.append("Employee count unknown")

        # Revenue
        revenue = self._parse_number(company.get('revenue', 0))
        if revenue > 0:
            parts.append(f"${revenue}M revenue")
        else:
            parts.append("Revenue unknown")

        # Tech
        tech_stack = company.get('tech_stack', [])
        if isinstance(tech_stack, list) and len(tech_stack) > 0:
            parts.append(f"Tech: {', '.join(tech_stack[:3])}")
        else:
            parts.append("Tech stack unknown")

        # Contacts
        contacts = company.get('contacts', [])
        real_contacts = [c for c in contacts if c.get('source') in ['hunter', 'apollo']]
        if real_contacts:
            parts.append(f"{len(real_contacts)} real contacts")
        elif contacts:
            parts.append(f"{len(contacts)} contacts (generated)")

        # Data quality note
        if details.get('data_quality') and '0/4' not in details['data_quality']:
            parts.append(f"📊 {details['data_quality']}")

        return f"{score}% — " + " | ".join(parts) if parts else f"{score}% — Good fit based on ICP"