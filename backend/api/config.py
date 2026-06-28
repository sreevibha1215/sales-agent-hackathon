from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from typing import Optional
from auth.dependencies import verify_token  # use shared dependency
from database.db import get_connection      # add this

load_dotenv()

router = APIRouter()

class ConfigExtractRequest(BaseModel):
    description: str
    workspace_id: Optional[str] = None

@router.post('/extract')
async def extract_config(request: ConfigExtractRequest, user=Depends(verify_token)):
    """Extract ICP using Groq AI"""
    
    api_key = os.getenv('GROQ_API_KEY')
    print(f"🔑 Groq API Key found: {'✅' if api_key else '❌'}")
    
    if not api_key:
        print("⚠️ No Groq API key - using fallback")
        result = get_smart_config(request.description)
    else:
        try:
            client = Groq(api_key=api_key)
            
            prompt = f"""Extract B2B sales configuration from this business description.

"{request.description}"

Rules:
- min_employees and max_employees refer to NUMBER OF EMPLOYEES at target companies, NOT stores/locations/revenue
- If employee count is not explicitly mentioned, use 0 for both
- "10+ stores" means store count, NOT employees — do NOT use it for employee fields
- triggers are buying signals like: hiring, funding, expansion, leadership_change, product_launch
- If a field is not mentioned, use null for strings, 0 for numbers, [] for arrays

Return ONLY this JSON object, no other text:
{{
    "industry": "main industry vertical",
    "geography": "target location/region",
    "min_employees": minimum number of EMPLOYEES as integer (0 if not mentioned),
    "max_employees": maximum number of EMPLOYEES as integer (0 if not mentioned),
    "personas": ["list of decision-maker job titles"],
    "triggers": ["list of buying signals"],
    "product": "what the seller is selling",
    "tech_stack": ["relevant technologies the target company might use"]
}}"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            text = response.choices[0].message.content
            config = json.loads(text)
            
            required_fields = ['industry', 'geography', 'min_employees', 'max_employees',
                               'personas', 'triggers', 'product', 'tech_stack']
            for field in required_fields:
                if field not in config or config[field] is None:
                    if field in ['personas', 'triggers', 'tech_stack']:
                        config[field] = []
                    elif field in ['min_employees', 'max_employees']:
                        config[field] = 0
                    else:
                        config[field] = "Not specified"
            
            print(f"✅ Groq extraction successful")
            result = {
                'config': config,
                'confidence': 'high',
                'source': 'groq',
                'message': '✅ Configuration extracted successfully!'
            }
            
        except Exception as e:
            print(f"⚠️ Groq error: {e}")
            result = get_smart_config(request.description)

    # ✅ Save config to workspace if workspace_id provided
    if request.workspace_id:
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "UPDATE workspaces SET config = %s WHERE id = %s",
                (json.dumps(result['config']), request.workspace_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            result['saved'] = True
            print(f"✅ Config saved to workspace {request.workspace_id}")
        except Exception as e:
            result['saved'] = False
            print(f"⚠️ Failed to save config: {e}")

    return result


def get_smart_config(description: str) -> dict:
    """Smart fallback configuration extraction"""
    desc_lower = description.lower()
    
    # Detect industry
    industry_keywords = {
        'SaaS': ['saas', 'software as a service', 'cloud software'],
        'Fintech': ['fintech', 'financial', 'banking', 'payment'],
        'Retail': ['retail', 'ecommerce', 'store', 'shop'],
        'Healthcare': ['healthcare', 'health', 'medical', 'hospital'],
        'Manufacturing': ['manufacturing', 'factory', 'industrial'],
        'Energy': ['energy', 'oil', 'gas', 'solar'],
        'Education': ['education', 'edtech', 'learning']
    }
    
    detected_industry = 'Technology'
    max_score = 0
    for industry, keywords in industry_keywords.items():
        score = sum(1 for kw in keywords if kw in desc_lower)
        if score > max_score:
            max_score = score
            detected_industry = industry
    
    # Detect geography
    geography_keywords = {
        'India': ['india', 'indian', 'delhi', 'mumbai', 'bangalore'],
        'North America': ['usa', 'us', 'united states', 'america', 'canada'],
        'Europe': ['europe', 'uk', 'united kingdom', 'germany', 'france'],
        'UK': ['uk', 'britain', 'england', 'london'],
        'Australia': ['australia', 'sydney', 'melbourne']
    }
    
    detected_geography = 'Global'
    max_score = 0
    for geo, keywords in geography_keywords.items():
        score = sum(1 for kw in keywords if kw in desc_lower)
        if score > max_score:
            max_score = score
            detected_geography = geo
    
    # Detect company size
    min_emp = 50
    max_emp = 500
    patterns = [
        r'(\d+)\s*[-–]\s*(\d+)\s*employees?',
        r'(\d+)\s*to\s*(\d+)\s*employees?',
    ]
    for pattern in patterns:
        match = re.search(pattern, desc_lower)
        if match:
            min_emp = int(match.group(1))
            max_emp = int(match.group(2))
            break
    
    # Detect personas
    personas = []
    persona_keywords = {
        'VP of Sales': ['vp of sales', 'vice president of sales', 'sales vp'],
        'CRO': ['cro', 'chief revenue officer', 'revenue officer'],
        'CTO': ['cto', 'chief technology officer', 'technology officer'],
        'CMO': ['cmo', 'chief marketing officer', 'marketing officer'],
        'CEO': ['ceo', 'chief executive officer'],
        'Director of Sales': ['director of sales', 'sales director'],
        'Head of Sales': ['head of sales', 'sales head'],
        'Operations Manager': ['operations manager', 'ops manager']
    }
    for persona, keywords in persona_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            personas.append(persona)
    if not personas:
        personas = ['VP of Sales', 'CRO']
    
    # Detect triggers
    triggers = []
    trigger_keywords = {
        'hiring': ['hiring', 'recruiting', 'open positions'],
        'funding': ['funding', 'raised', 'series a', 'series b', 'investment'],
        'expansion': ['expansion', 'expanding', 'new markets', 'growing'],
        'technology_adoption': ['tech stack', 'digital transformation']
    }
    for trigger, keywords in trigger_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            triggers.append(trigger)
    if not triggers:
        triggers = ['hiring', 'funding', 'expansion']
    
    # Detect product
    product = 'Software Solution'
    product_keywords = {
        'CRM Software': ['crm', 'customer relationship'],
        'Inventory Management': ['inventory', 'stock', 'warehouse'],
        'Marketing Platform': ['marketing', 'campaign'],
        'HR Software': ['hr', 'human resources'],
        'Analytics Platform': ['analytics', 'data', 'insights'],
        'ERP System': ['erp', 'enterprise resource'],
        'Project Management': ['project management', 'task management']
    }
    for prod, keywords in product_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            product = prod
            break
    
    # Tech stack
    tech_stack = ['Salesforce', 'AWS']
    if 'hubspot' in desc_lower:
        tech_stack.append('HubSpot')
    if 'azure' in desc_lower:
        tech_stack.append('Azure')
    if 'google' in desc_lower:
        tech_stack.append('Google Cloud')
    
    config = {
        'industry': detected_industry,
        'geography': detected_geography,
        'min_employees': min_emp,
        'max_employees': max_emp,
        'personas': personas,
        'triggers': triggers,
        'product': product,
        'tech_stack': tech_stack[:6]
    }
    
    return {
        'config': config,
        'confidence': 'medium',
        'source': 'smart_fallback',
        'message': '⚠️ Used keyword fallback (Groq unavailable)'
    }