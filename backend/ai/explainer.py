import os
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

SYSTEM_RULES = """You explain government scheme eligibility results in simple, warm, plain language.

STRICT RULES - you must follow these exactly:
- You do NOT decide eligibility. The status (ELIGIBLE / NOT_ELIGIBLE / NEEDS_MORE_INFORMATION) is already final and given to you - never contradict, soften, or second-guess it.
- You do NOT introduce any new requirement, condition, document, or fact that isn't in the verified checks given to you.
- You do NOT invent numbers, dates, or figures. Only reference values present in the data.
- If information is missing, say so plainly rather than guessing.
- Never claim official government approval or speak on behalf of the government.
- Keep it short: 2-4 sentences.
- Write ONLY in the requested output language. Do not mix languages."""


class ExplainerError(Exception):
    pass


def _fallback_explanation(
    scheme_name: str, status: str, checks: list[dict], missing_fields: list[str]
) -> str:
    if status == "ELIGIBLE":
        return f"Based on the verified conditions, you appear to be eligible for {scheme_name}."
    if status == "NEEDS_MORE_INFORMATION":
        fields = ", ".join(missing_fields) if missing_fields else "a few more details"
        return (
            f"We need {fields} before we can confirm your eligibility for {scheme_name}."
        )
    failed = [c.get("label") for c in checks if c.get("status") == "FAILED"]
    failed_str = ", ".join(str(f) for f in failed) if failed else "one or more conditions"
    return f"Based on the verified conditions, you don't currently meet the requirements for {scheme_name} ({failed_str})."


async def explain_result(
    scheme_name: str,
    status: str,
    checks: list[dict],
    missing_fields: list[str],
    language: str = "English",
) -> tuple[str, str]:
    if not GEMINI_API_KEY:
        return (
            _fallback_explanation(scheme_name, status, checks, missing_fields),
            "fallback",
        )

    verified_payload = {
        "scheme": scheme_name,
        "status": status,
        "checks": [
            {
                "label": c.get("label"),
                "status": c.get("status"),
                "actual": c.get("actual"),
                "expected": c.get("expected"),
            }
            for c in checks
        ],
        "missing_fields": missing_fields,
    }

    user_prompt = (
        f"Explain this verified eligibility result in {language}.\n\n"
        f"Verified data (do not add anything beyond this):\n{verified_payload}"
    )

    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_RULES}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                 "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 800,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(GEMINI_URL, params={"key": GEMINI_API_KEY}, json=body)

        if resp.status_code != 200:
            raise ExplainerError(f"Gemini API returned {resp.status_code}: {resp.text[:300]}")

        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return (text, "ai")

    except (httpx.RequestError, ExplainerError, KeyError, IndexError) as e:
        print(f"[explain] Gemini call failed: {e}")
        return (
            _fallback_explanation(scheme_name, status, checks, missing_fields),
            "fallback",
        )