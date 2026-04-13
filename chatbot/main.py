# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskRequest(BaseModel):
    task_name: str

# system prompt enforces Acceptance Criteria (AC 1.1.1 - 1.1.3)
SYSTEM_PROMPT = """
You are a gentle, clear, and literal assistant helping a neurodivergent child.
Your ONLY job is to take a large task and break it down into smaller steps.

RULES:
1. Divide the task into 2 to 5 steps based on how complex it is. A simple task needs 2 steps, a hard task needs 4 or 5.
2. Use very simple, concrete, and easy-to-understand language.
3. Do not use metaphors, sarcasm, or complex vocabulary.
4. DO NOT say "Hello" or "Here are your steps." Output ONLY raw JSON.

JSON FORMAT EXAMPLE:
{
  "task": "Original Task Name",
  "steps": [
    {"step_number": 1, "description": "Simple action 1"},
    {"step_number": 2, "description": "Simple action 2"},
    {"step_number": 3, "description": "Simple action 3"}
  ]
}
"""

@app.post("/api/breakdown-task")
async def breakdown_task(request: TaskRequest):
    # Call local Ollama instance (default port 11434)
    ollama_url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": "llama3", # or "phi3"
        "prompt": f"Task to break down: {request.task_name}",
        "system": SYSTEM_PROMPT,
        "stream": False,
        "format": "json" # Forces the open-source model to output strict JSON
    }
    
    try:
        response = requests.post(ollama_url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Parse the JSON string returned by the LLM
        structured_data = json.loads(data["response"])
        return structured_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)