from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from ai.explainer import explain_result

router = APIRouter(prefix="/explain", tags=["explain"])


class ExplainCheckInput(BaseModel):
    label: str
    status: str
    actual: object = None
    expected: object = None


class ExplainRequest(BaseModel):
    scheme_name: str
    status: str
    checks: List[ExplainCheckInput]
    missing_fields: List[str] = []
    language: str = "English"


class ExplainResponse(BaseModel):
    explanation: str
    source: str


@router.post("", response_model=ExplainResponse)
async def explain(payload: ExplainRequest) -> ExplainResponse:
    text, source = await explain_result(
        scheme_name=payload.scheme_name,
        status=payload.status,
        checks=[c.model_dump() for c in payload.checks],
        missing_fields=payload.missing_fields,
        language=payload.language,
    )
    return ExplainResponse(explanation=text, source=source)
