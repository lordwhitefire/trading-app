from fastapi import APIRouter, HTTPException
import os

router = APIRouter(prefix="/api/translator")

@router.post("/")
async def translate_strategy(text: dict):
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")
    
    url = "https://api.gemini.com/translate"
    headers = {'Authorization': f'Bearer {GEMINI_API_KEY}'}
    payload = {
        'text': text['text'],
        'response_format': '{"conditions": [{"indicator": str, "operator": str, "value": float, "period": optional int, "explanation": str}], "summary": str}'
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        conditions = []
        for condition in data['conditions']:
            conditions.append({
                'indicator': condition['indicator'],
                'operator': condition['operator'],
                'value': condition['value'],
                'period': condition.get('period'),
                'explanation': condition['explanation']
            })
        
        return {
            'conditions': conditions,
            'summary': data['summary']
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
