# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import json
import os

# Load the variables from your .env file
load_dotenv() 

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

#Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
    {
      "step_number": 1,
      "step_title": "Short step name",
      "description": "Simple action 1"
    },
    {
      "step_number": 2,
      "step_title": "Short step name",
      "description": "Simple action 2"
    },
    {
      "step_number": 3,
      "step_title": "Short step name",
      "description": "Simple action 3"
    }
  ]
}
"""

@app.post("/api/breakdown-task")
async def breakdown_task(request: TaskRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        # Using the latest supported Llama 3.1 model on Groq
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Task to break down: {request.task_name}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)

        # NEW: If Groq sends an error, this grabs the exact detailed message!
        if not response.ok:
            print(f"GROQ REJECTED THE REQUEST. Reason: {response.text}")

        response.raise_for_status()
        data = response.json()

        raw_response = data["choices"][0]["message"]["content"]
        print(f"Raw AI Output: {raw_response}")

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
       
    except requests.exceptions.RequestException as e:
        print(f"Groq API Connection Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not connect to Groq.")
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI returned invalid JSON.")
    except Exception as e:
        print(f"General Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
