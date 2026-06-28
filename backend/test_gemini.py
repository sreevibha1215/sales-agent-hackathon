# backend/test_gemini.py
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load .env
load_dotenv()

# Get API key
api_key = os.getenv('GOOGLE_API_KEY')
print(f"🔑 API Key found: {'✅ YES' if api_key else '❌ NO'}")

if api_key:
    print(f"📝 Key starts with: {api_key[:10]}...")
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Test
        response = model.generate_content("Hello! Say 'Gemini is working!'")
        print(f"✅ Gemini Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
else:
    print("❌ No API key found in .env")