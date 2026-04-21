from fastapi import APIRouter, HTTPException
import os
import google.generativeai as genai
import json

router = APIRouter(prefix="/api/translator")

@router.post("/")
async def translate_strategy(text: dict):
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    prompt = f"Translate the following strategy text into valid JSON with this structure: {{\"conditions\": [{{\"indicator\": str, \"operator\": str, \"value\": float, \"period\": optional int, \"explanation\": str}}], \"summary\": str}}\n\n{text['text']}"
    
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        
        parsed_response = json.loads(raw)
        
        conditions = []
        for condition in parsed_response['conditions']:
            conditions.append({
                'indicator': condition['indicator'],
                'operator': condition['operator'],
                'value': condition['value'],
                'period': condition.get('period'),
                'explanation': condition['explanation']
            })
        
        return {
            'conditions': conditions,
            'summary': parsed_response['summary']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
