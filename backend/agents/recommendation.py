from typing import Dict, Any, List

class RecommendationAgent:
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        scored_companies = state.get('scores', [])
        config = state.get('icp_config', {})
        
        # Sort by intent score
        sorted_companies = sorted(
            scored_companies,
            key=lambda x: x.get('intent_score', 0),
            reverse=True
        )
        
        recommendations = []
        for i, company in enumerate(sorted_companies[:10]):
            recommendations.append({
                'rank': i + 1,
                'company': company.get('name', 'Unknown'),
                'intent_score': company.get('intent_score', 0),
                'icp_score': company.get('icp_score', 0),
                'reasoning': company.get('reasoning', 'Good fit'),
                'icp_reasons': company.get('icp_reasons', []),
                
                # Company details
                'description': company.get('description', ''),
                'industry': company.get('industry', config.get('industry', '')),
                'headquarters': company.get('headquarters', 'Unknown'),
                'employees': company.get('employees', 0),
                'revenue': company.get('revenue', 'Unknown'),
                'funding_raised': company.get('funding_raised', 'Unknown'),
                'tech_stack': company.get('tech_stack', []),
                'founding_year': company.get('founding_year', 0),
                'url': company.get('url', ''),
                
                # Contacts
                'contacts': company.get('contacts', []),
                
                # Action
                'next_action': self._suggest_next_action(company, i),
                'priority': self._get_priority(company.get('intent_score', 0)),
                
                # Source
                'data_source': company.get('source', 'unknown')
            })
        
        state['recommendations'] = recommendations
        print(f"📊 Summary: {state['summary']}")
        state['completed_agents'] = state.get('completed_agents', []) + ['recommendation']
        print(f"✅ Generated {len(recommendations)} recommendations")

       
        return state
    
    def _suggest_next_action(self, company: Dict, rank: int) -> str:
        score = company.get('intent_score', 0)
        contacts = company.get('contacts', [])
        
        if contacts and score >= 70:
            contact_name = contacts[0].get('name', 'decision maker')
            return f"📧 Send personalized demo request to {contact_name}"
        elif score >= 70:
            return "📧 Send personalized outreach email to decision makers"
        elif score >= 50:
            return "📞 Schedule introductory discovery call"
        else:
            return "📊 Send relevant case study and product information"
    
    def _get_priority(self, score: int) -> str:
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        else:
            return "LOW"