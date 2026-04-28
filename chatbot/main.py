from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List
import requests
import json
import os
from behavior_engine import calculate_overload_risk, load_model

# Load the variables from your .env file
load_dotenv() 

app = FastAPI()

# Initialize the ML model when the FastAPI server starts
@app.on_event("startup")
async def startup_event():
    print("Booting up backend services...")
    load_model()

class RiskRequest(BaseModel):
    hours_slept: float
    overwhelmed_count: int
    tasks_abandoned: int
    tasks_completed: int

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. UPDATE: Tell the backend to expect a pet_type when breaking down tasks
class TaskRequest(BaseModel):
    task_name: str
    pet_type: str = "bear" # Default fallback

# 2. ADD: The data model for the new chat widget
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    pet_type: str = "bear"
    history: List[ChatMessage] = []
    user_role: str = "child" # NEW: Default to child for safety

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ==========================================
# ENDPOINT 1: TASK BREAKDOWN
# ==========================================
@app.post("/api/breakdown-task")
async def breakdown_task(request: TaskRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # UPDATE: The prompt is now dynamic and knows exactly which pet it is!
    dynamic_system_prompt = f"""
    You are a friendly, calming digital companion for a neurodivergent child.
    Your current persona is a {request.pet_type}. 
    The user is your human friend. Your job is to help them break down big tasks into small, easy steps.

    RULES:
    1. Divide the task into 2 to 5 steps based on how complex it is. A simple task needs 2 steps, a hard task needs 4 or 5.
    2. Use very simple, concrete, and easy-to-understand language.
    3. Do not use metaphors, sarcasm, or complex vocabulary.
    4. Keep your companion_message short, encouraging, and supportive (1 or 2 sentences max).
    5. Output NOTHING but a single, valid JSON object.

    JSON FORMAT EXAMPLE:
    {{
      "companion_message": "Hey friend! This task can be tough, but we can do it together. Here is our mission plan:",
      "steps": [
        {{
          "step_number": 1,
          "step_title": "Short step name",
          "description": "Simple action 1"
        }}
      ]
    }}
    """

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": dynamic_system_prompt},
            {"role": "user", "content": f"Task to break down: {request.task_name}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)

        if not response.ok:
            print(f"GROQ REJECTED THE REQUEST. Reason: {response.text}")

        response.raise_for_status()
        data = response.json()

        raw_response = data["choices"][0]["message"]["content"]
        
        # Clean up markdown blocks before parsing
        clean_text = raw_response.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        structured_data = json.loads(clean_text)
        return structured_data
        
    except Exception as e:
        print(f"General Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINT 2: COMPANION CHAT
# ==========================================
@app.post("/api/chat")
async def companion_chat(request: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # 2. NEW: Role-Based Prompting!
    if request.user_role == "parent":
        chat_system_prompt = """
        You are a supportive, knowledgeable, and empathetic 'Parent Guide' expert in neurodiversity (Autism, ADHD, PDA, etc.).
        Your goal is to help parents understand their child's behaviors, prevent sensory overload, and offer gentle, practical parenting strategies.
        
        Rules:
        1. Keep responses concise and actionable (2-4 sentences max).
        2. Maintain a warm, professional, and non-judgmental tone.
        3. Frame behaviors as communication (e.g., 'refusal' is often 'overwhelm').
        4. NEVER give medical diagnoses. 
        5. You have access to recent conversation history. Use it for context.
        """
    else:
        chat_system_prompt = f"""
        You are a friendly, highly supportive digital companion for a neurodivergent child (age 7-13).
        Your current persona is a {request.pet_type}. Act like this character in a subtle, cute way.
        
        Rules:
        1. Keep responses very short (1-3 sentences max).
        2. Use simple, accessible language. Be encouraging and emotionally validating.
        3. You have access to the recent conversation history. Use it to maintain context!
        4. If the child asks about dangerous or complex adult topics, politely deflect.
        5. CRITICAL: You are a text-only AI. You cannot see pictures. Ask them to describe images instead.
        """

    # Build the message array starting with the correct system prompt
    groq_messages = [{"role": "system", "content": chat_system_prompt}]
    
    for msg in request.history:
        if msg.role in ["user", "assistant"]:
            groq_messages.append({"role": msg.role, "content": msg.content})
            
    groq_messages.append({"role": "user", "content": request.message})

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": groq_messages,
        "temperature": 0.6 
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        ai_reply = data["choices"][0]["message"]["content"]
        return {"reply": ai_reply.strip()}

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"reply": "I'm having a little trouble thinking right now. Could you say that again?"}

# ==========================================
# ENDPOINT 3: PREDICT SENSORY OVERLOAD RISK
# ==========================================
@app.post("/api/predict-risk")
async def predict_risk(request: RiskRequest):
    try:
        # The behavior engine handles the real-time calculation
        risk_assessment = calculate_overload_risk(
            hours_slept=request.hours_slept,
            overwhelmed_count=request.overwhelmed_count,
            tasks_abandoned=request.tasks_abandoned,
            tasks_completed=request.tasks_completed
        )
        return risk_assessment
        
    except Exception as e:
        print(f"Prediction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not process behavioral data.")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)