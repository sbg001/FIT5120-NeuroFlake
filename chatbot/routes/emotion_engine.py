from pydantic import BaseModel
import json
import requests
from fastapi import APIRouter, HTTPException
import os
from typing import Optional
from datetime import datetime, timezone

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class SentimentRequest(BaseModel):
    text: str
    task_context: Optional[str] = None  # Optional: What task were they looking at?

@router.post("/api/analyze-sentiment")
async def analyze_sentiment(request: SentimentRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # We use a strict system prompt to force the LLM to act as a classifier
    system_prompt = f"""
    You are an expert child psychology NLP engine. Analyze the following text written by a neurodivergent child.
    Determine the underlying sentiment and primary emotion. 
    
    Text: "{request.text}"
    Current Task Context: {request.task_context if request.task_context else "None"}

    Respond ONLY with a valid, raw JSON object in this exact format. Do not use markdown formatting.
    {{
        "sentiment": "Positive" | "Neutral" | "Negative",
        "emotion": "Joy" | "Calm" | "Frustration" | "Overwhelm" | "Sadness" | "Excitement" | "Fatigue"
    }}
    """

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "system", "content": system_prompt}],
        "temperature": 0.1 # Low temperature for consistent classification
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        raw_text = data["choices"][0]["message"]["content"].strip()
        
        # Clean up in case Groq accidentally adds markdown using string replacement to avoid renderer bugs
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        sentiment_data = json.loads(raw_text)

        return {
            "sentiment": sentiment_data["sentiment"],
            "emotion": sentiment_data["emotion"],
            "text": request.text,
            "task_context": request.task_context,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        print(f"Sentiment Analysis Error: {str(e)}")
        return {
            "sentiment": "Neutral",
            "emotion": "Calm",
            "text": request.text,
            "task_context": request.task_context,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }