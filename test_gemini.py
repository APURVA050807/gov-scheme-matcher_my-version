import os
from dotenv import load_dotenv
load_dotenv()
import httpx

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

body = {
    "systemInstruction": {"parts": [{"text": "You explain things simply."}]},
    "contents": [{"role": "user", "parts": [{"text": "Say hello in Hindi in one sentence."}]}],
    "generationConfig": {
        "temperature": 0.3,
        "maxOutputTokens": 1024,
        "thinkingConfig": {"thinkingBudget": 0},
    },
}

resp = httpx.post(url, params={"key": api_key}, json=body, timeout=30.0)
print("HTTP status:", resp.status_code)
print("Response body:\n", resp.text)