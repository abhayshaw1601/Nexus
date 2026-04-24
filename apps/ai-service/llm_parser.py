import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class LLMParser:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def parse_ocr_text(self, text: str):
        prompt = f"""
        You are an assistant for an NGO community response system. 
        Analyze the following text extracted from a handwritten survey and provide a structured JSON response.
        
        Text: "{text}"
        
        Extract:
        1. category: One of ['Sanitation', 'Medical', 'Education', 'Infrastructure', 'Other']
        2. urgency: A number from 1 to 5 (1 being low, 5 being critical)
        3. description: A clear, concise summary of the problem.
        
        Respond ONLY with a valid JSON object in this format:
        {{
            "category": "...",
            "urgency": 3,
            "description": "..."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Remove any markdown formatting if present
            clean_response = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(clean_response)
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "category": "Other",
                "urgency": 3,
                "description": "AI analysis failed."
            }
