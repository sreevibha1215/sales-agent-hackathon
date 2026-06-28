import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_config(text: str) -> dict:
    """Extract structured ICP config from natural language"""
    try:
        prompt = f"""Extract business configuration from this text and return ONLY valid JSON, no explanation:

Text: "{text}"

Return this exact JSON structure:
{{
    "company_type": "B2B or B2C",
    "industry": "industry name",
    "target_role": "job title to target",
    "company_size": "small/medium/large/enterprise",
    "region": "geographic region",
    "pain_points": ["pain point 1", "pain point 2"],
    "keywords": ["keyword1", "keyword2"]
}}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        text_response = response.choices[0].message.content.strip()
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[1].split("```")[0].strip()

        return {"success": True, "config": json.loads(text_response)}
    except Exception as e:
        return {"success": False, "error": str(e)}