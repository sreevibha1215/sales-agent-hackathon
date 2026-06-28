# backend/test_apollo.py
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test_apollo():
    api_key = os.getenv('APOLLO_API_KEY')
    print(f"🔑 API Key: {'✅ Found' if api_key else '❌ Missing'}")
    
    if not api_key:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.apollo.io/v1/mixed_people/search",
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": api_key
                },
                json={
                    "q_organization_name": "Salesforce",
                    "per_page": 3
                },
                timeout=15.0
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                people = data.get('people', [])
                print(f"✅ Found {len(people)} people at Salesforce")
                for person in people[:2]:
                    print(f"  👤 {person.get('first_name')} {person.get('last_name')} - {person.get('title')}")
            else:
                print(f"❌ Error: {response.text}")
                
    except Exception as e:
        print(f"⚠️ Exception: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_apollo())