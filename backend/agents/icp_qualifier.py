from typing import Dict, Any, List, Tuple

class ICPQualifierAgent:
    
    # Industry synonym mapping
    INDUSTRY_SYNONYMS = {
        'manufacturing': ['manufacturing', 'industrial', 'production', 'factory',
                         'steel', 'chemicals', 'automotive', 'automobile', 'auto',
                         'machinery', 'engineering', 'technology', 'services',
                         'supplier', 'components', 'equipment', 'electronics'],
        'saas': ['saas', 'software', 'cloud', 'platform', 'crm', 'erp',
                 'solution', 'application', 'tech', 'digital', 'subscription'],
        'fintech': ['fintech', 'financial', 'banking', 'payment', 'insurance',
                    'investment', 'lending', 'credit', 'finance', 'money'],
        'retail': ['retail', 'ecommerce', 'store', 'shop', 'commerce',
                   'consumer', 'merchandise', 'distribution', 'wholesale'],
        'healthcare': ['healthcare', 'health', 'medical', 'hospital', 'pharma',
                       'pharmaceutical', 'biotech', 'clinical', 'patient', 'care'],
        'energy': ['energy', 'oil', 'gas', 'solar', 'wind', 'power',
                   'utility', 'renewable', 'electricity', 'fuel'],
        'education': ['education', 'learning', 'edtech', 'training', 'university',
                      'school', 'course', 'academic', 'student', 'teaching'],
    }

    # Geography synonym mapping  
    GEO_SYNONYMS = {
        'germany': ['germany', 'german', 'deutschland', 'berlin', 'munich',
                    'hamburg', 'frankfurt', 'stuttgart', 'cologne', 'dusseldorf',
                    'gmbh', 'ag', ' se ', 'thyssenkrupp', 'bosch', 'siemens',
                    'bayer', 'basf', 'bmw', 'volkswagen', 'mercedes', 'adidas'],
        'india': ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'hyderabad',
                  'chennai', 'pune', 'pvt', 'ltd'],
        'usa': ['usa', 'united states', 'america', 'american', 'new york',
                'california', 'texas', 'chicago', 'inc', 'corp', 'llc'],
        'uk': ['uk', 'britain', 'british', 'england', 'london', 'plc', 'ltd'],
        'north america': ['usa', 'canada', 'america', 'american', 'inc', 'corp'],
    }

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        config = state.get('icp_config', {})
        companies = state.get('companies', [])

        print(f"🎯 Qualifying {len(companies)} companies against ICP...")

        qualified = []
        for company in companies:
            score, reasons = self._calculate_score(company, config)

            if score >= 0.2:  # low threshold — company intel will refine later
                qualified.append({
                    **company,
                    'icp_score': round(score, 2),
                    'icp_reasons': reasons,
                    'qualified': True
                })
                print(f"  ✅ {company.get('name')} — score: {score:.2f} — {', '.join(reasons)}")
            else:
                print(f"  ❌ {company.get('name')} — score: {score:.2f} — too low")

        # Always keep at least 6 companies for demo
        if len(qualified) < 6 and len(companies) > 0:
            print(f"⚠️ Too few qualified, keeping top by relevance")
            sorted_all = sorted(companies, key=lambda c: c.get('relevance_score', 0), reverse=True)
            for company in sorted_all:
                if len(qualified) >= 6:
                    break
                already = any(q.get('name') == company.get('name') for q in qualified)
                if not already:
                    qualified.append({
                        **company,
                        'icp_score': 0.4,
                        'icp_reasons': ['Selected by relevance score'],
                        'qualified': True
                    })

        state['qualified_companies'] = qualified[:10]
        print(f"✅ {len(state['qualified_companies'])} companies qualified")
        return state

    def _calculate_score(self, company: Dict, config: Dict) -> Tuple[float, List[str]]:
        score = 0.0
        reasons = []

        # Build searchable text from all available fields
        name = company.get('name', '')
        description = company.get('description', '')
        url = company.get('url', '')
        search_text = f"{name} {description} {url}".lower()

        # --- Industry match (40%) ---
        industry = config.get('industry', '').lower()
        if industry:
            # Direct match
            if industry in search_text:
                score += 0.4
                reasons.append(f"Industry match: {industry}")
            else:
                # Synonym match
                synonyms = self._get_industry_synonyms(industry)
                matched_synonyms = [s for s in synonyms if s in search_text]
                if matched_synonyms:
                    # More synonyms = higher confidence
                    synonym_score = min(0.4, 0.15 + 0.05 * len(matched_synonyms))
                    score += synonym_score
                    reasons.append(f"Industry synonyms: {', '.join(matched_synonyms[:3])}")

        # --- Geography match (30%) ---
        geography = config.get('geography', '').lower()
        if geography:
            if geography in search_text:
                score += 0.3
                reasons.append(f"Geography match: {geography}")
            else:
                # Synonym match
                geo_synonyms = self._get_geo_synonyms(geography)
                matched_geo = [s for s in geo_synonyms if s in search_text]
                if matched_geo:
                    geo_score = min(0.3, 0.1 + 0.05 * len(matched_geo))
                    score += geo_score
                    reasons.append(f"Geography synonyms: {', '.join(matched_geo[:2])}")

        # --- Product relevance (20%) ---
        product = config.get('product', '').lower()
        if product:
            product_words = [w for w in product.split() if len(w) > 3]
            matches = sum(1 for w in product_words if w in search_text)
            if matches > 0:
                score += 0.2 * (matches / max(len(product_words), 1))
                reasons.append(f"Product relevance")

        # --- Source bonus (10%) ---
        if company.get('source') in ['tavily', 'groq_generated']:
            score += 0.1
            reasons.append("Verified source")

        if not reasons:
            reasons.append("Basic match")

        return score, reasons

    def _get_industry_synonyms(self, industry: str) -> List[str]:
        """Get synonyms for an industry"""
        for key, synonyms in self.INDUSTRY_SYNONYMS.items():
            if key in industry or industry in key:
                return synonyms
        # Fallback: split industry into words
        return industry.split()

    def _get_geo_synonyms(self, geography: str) -> List[str]:
        """Get synonyms for a geography"""
        for key, synonyms in self.GEO_SYNONYMS.items():
            if key in geography or geography in key:
                return synonyms
        return geography.split()