import base64
import json
import os
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

EXTRACTION_RULES = """You extract ONE specific figure from a photo of an Indian government income certificate: the annual income amount stated on the document.

STRICT RULES:
- Only report a figure if it is clearly and explicitly labeled as an income amount on the document (e.g. "Annual Income", "Total Income").
- Do NOT guess, estimate, calculate, or infer a figure that isn't explicitly printed.
- Do NOT assess whether the document looks genuine or fake - that is not your job.
- If you cannot confidently find an explicit income figure, return null for detected_income.
- Respond with ONLY valid JSON in this exact shape, nothing else, no markdown fences:
{"detected_income": <number or null>, "raw_snippet": "<the exact text near the income figure, or empty string>"}"""


class OcrError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


async def extract_income_from_image(image_bytes: bytes, mime_type: str) -> dict:
    if not GEMINI_API_KEY:
        raise OcrError(
            "GEMINI_API_KEY is not set on the backend. "
            "Set it as an environment variable before starting uvicorn."
        )

    encoded = base64.b64encode(image_bytes).decode("utf-8")

    body = {
        "systemInstruction": {"parts": [{"text": EXTRACTION_RULES}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": "Extract the annual income figure from this document image."},
                    {"inlineData": {"mimeType": mime_type, "data": encoded}},
                ],
            }
        ],
          "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(GEMINI_URL, params={"key": GEMINI_API_KEY}, json=body)
        except httpx.RequestError as e:
            raise OcrError(f"Could not reach Gemini API: {e}") from e

    if resp.status_code != 200:
        raise OcrError(f"Gemini API returned {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise OcrError(f"Unexpected Gemini response shape: {data}") from e

    text = _strip_code_fences(text)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        raise OcrError(f"Gemini did not return valid JSON: {text[:200]}") from e

    return {
        "detected_income": parsed.get("detected_income"),
        "raw_snippet": parsed.get("raw_snippet", ""),
    }