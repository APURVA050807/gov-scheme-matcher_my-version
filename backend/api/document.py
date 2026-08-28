from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.ocr.document_reader import extract_income_from_image, OcrError

router = APIRouter(prefix="/document", tags=["document"])

MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class IncomeExtractionResponse(BaseModel):
    detected_income: Optional[float] = None
    raw_snippet: str = ""


@router.post("/extract-income", response_model=IncomeExtractionResponse)
async def extract_income(file: UploadFile = File(...)) -> IncomeExtractionResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                "Upload a JPG, PNG, or WEBP image of the document."
            ),
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    try:
        result = await extract_income_from_image(file_bytes, file.content_type)
    except OcrError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return IncomeExtractionResponse(**result)