from typing import Dict, Any, List, Tuple

class ICPQualifierAgent:
    
    INDUSTRY_SYNONYMS = {
        'saas': ['saas', 'software', 'cloud', 'platform', 'crm', 'erp',
                 'solution', 'application', 'tech', 'digital', 'subscription'],
        'fintech': ['fintech', 'financial', 'banking', 'payment', 'insurance',
                    'investment', 'lending', 'credit', 'finance', 'money'],
        'manufacturing': ['manufacturing', 'industrial', 'production', 'factory',
                         'steel', 'chemicals', 'automotive', 'automobile'],
        'retail': ['retail', 'ecommerce', 'store', 'shop', 'commerce',
                   'consumer', 'merchandise', 'distribution'],
        'healthcare': ['healthcare', 'health', 'medical', 'hospital', 'pharma',
                       'pharmaceutical', 'biotech', 'clinical', 'patient', 'care'],
        'energy': ['energy', 'oil', 'gas', 'solar', 'wind', 'power',
                   'utility', 'renewable', 'electricity', 'fuel'],
        'education': ['education', 'learning', 'edtech', 'training', 'university',
                      'school', 'course', 'academic', 'student', 'teaching'],
    }

    GEO_SYNONYMS = {
        'india': ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'hyderabad',
                  'chennai', 'pune', 'gurgaon', 'noida', 'pvt', 'ltd'],
        'usa': ['usa', 'united states', 'america', 'american', 'new york',
                'california', 'texas', 'chicago', 'san francisco', 'inc', 'corp'],
        'uk': ['uk', 'britain', 'british', 'england', 'london', 'plc', 'ltd'],
        'europe': ['europe', 'germany', 'france', 'spain', 'italy', 'netherlands'],
    }

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        config = state.get('icp_config', {})
        companies = state.get('companies', [])

        print(f"🎯 Qualifying {len(companies)} companies against ICP...")

        qualified = []
        for company in companies:
            score, reasons = self._calculate_score(company, config)

            # Higher threshold - only keep good matches
            if score >= 0.3:  # Increased from 0.2
                qualified.append({
                    **company,
                    'icp_score': round(score, 2),
                    'icp_reasons': reasons,
                    'qualified': True
                })
                print(f"  ✅ {company.get('name')} — score: {score:.2f} — {', '.join(reasons)}")
            else:
                print(f"  ❌ {company.get('name')} — score: {score:.2f} — too low")

        # Always keep top companies
        if len(qualified) < 4 and len(companies) > 0:
            print(f"⚠️ Too few qualified, keeping top by relevance")
            sorted_all = sorted(companies, key=lambda c: c.get('relevance_score', 0), reverse=True)
            for company in sorted_all:
                if len(qualified) >= 4:
                    break
                already = any(q.get('name') == company.get('name') for q in qualified)
                if not already:
                    qualified.append({
                        **company,
                        'icp_score': 0.3,
                        'icp_reasons': ['Selected by relevance score'],
                        'qualified': True
                    })

        state['qualified_companies'] = qualified[:8]
        print(f"✅ {len(state['qualified_companies'])} companies qualified")
        return state

    def _calculate_score(self, company: Dict, config: Dict) -> Tuple[float, List[str]]:
        score = 0.0
        reasons = []

        name = company.get('name', '')
        description = company.get('description', '')
        url = company.get('url', '')
        search_text = f"{name} {description}".lower()

        # --- Industry match (35%) ---
        industry = config.get('industry', '').lower()
        if industry:
            # Direct match
            if industry in search_text:
                score += 0.35
                reasons.append(f"Industry: {industry}")
            else:
                # Exact synonym match only
                synonyms = self._get_industry_synonyms(industry)
                matched_synonyms = [s for s in synonyms if s in search_text]
                if matched_synonyms:
                    # More stringent: only give full if multiple matches
                    if len(matched_synonyms) >= 2:
                        score += 0.35
                        reasons.append(f"Industry: {industry} (synonyms)")
                    else:
                        score += 0.15
                        reasons.append(f"Industry: partial match")

        # --- Geography match (25%) ---
        geography = config.get('geography', '').lower()
        if geography:
            if geography in search_text:
                score += 0.25
                reasons.append(f"Geography: {geography}")
            else:
                # More strict geography matching
                geo_synonyms = self._get_geo_synonyms(geography)
                matched_geo = [s for s in geo_synonyms if s in search_text]
                if matched_geo:
                    # Only give full if multiple matches
                    if len(matched_geo) >= 2:
                        score += 0.25
                        reasons.append(f"Geography: {geography}")
                    else:
                        score += 0.10
                        reasons.append(f"Geography: partial")

        # --- Company size match (25%) ---
        employees = company.get('employees', 0)
        min_emp = config.get('min_employees', 50)
        max_emp = config.get('max_employees', 500)
        
        if employees > 0:
            if min_emp <= employees <= max_emp:
                score += 0.25
                reasons.append(f"Size: {employees} employees ✅")
            elif employees < min_emp:
                score += 0.10
                reasons.append(f"Size: {employees} (below min)")
            elif employees > max_emp:
                score += 0.05
                reasons.append(f"Size: {employees} (above max)")
        else:
            # Unknown employee count - small penalty
            score += 0.05
            reasons.append("Size: unknown")

        # --- Product relevance (15%) ---
        product = config.get('product', '').lower()
        if product:
            product_words = [w for w in product.split() if len(w) > 3]
            matches = sum(1 for w in product_words if w in search_text)
            if matches > 0:
                # Only give full if product is clearly mentioned
                match_ratio = matches / max(len(product_words), 1)
                if match_ratio >= 0.5:
                    score += 0.15
                    reasons.append("Product: relevant")
                else:
                    score += 0.08
                    reasons.append("Product: partial")

        if not reasons:
            reasons.append("Basic match")

        return min(score, 1.0), reasons

    def _get_industry_synonyms(self, industry: str) -> List[str]:
        for key, synonyms in self.INDUSTRY_SYNONYMS.items():
            if key in industry or industry in key:
                return synonyms
        return industry.split()

    def _get_geo_synonyms(self, geography: str) -> List[str]:
        for key, synonyms in self.GEO_SYNONYMS.items():
            if key in geography or geography in key:
                return synonyms
        return geography.split()