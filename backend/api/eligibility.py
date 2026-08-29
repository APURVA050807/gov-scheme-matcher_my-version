import json
from pathlib import Path
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from models import Scheme, SchemeResult, UserProfile

from rules.engine import evaluate_all_schemes

router = APIRouter(prefix="/eligibility", tags=["eligibility"])

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "schemes.json"


def load_schemes() -> List[Scheme]:
    raw = json.loads(DATA_PATH.read_text())
    return [Scheme(**item) for item in raw]


class EligibilityCheckRequest(BaseModel):
    profile: UserProfile


class EligibilityCheckResponse(BaseModel):
    results: List[SchemeResult]


@router.post("/check", response_model=EligibilityCheckResponse)
def check_eligibility(payload: EligibilityCheckRequest) -> EligibilityCheckResponse:
    schemes = load_schemes()
    results = evaluate_all_schemes(schemes, payload.profile)
    return EligibilityCheckResponse(results=results)


@router.get("/schemes", response_model=List[Scheme])
def list_schemes() -> List[Scheme]:
    return load_schemes()
