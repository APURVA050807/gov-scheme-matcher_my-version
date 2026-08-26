from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.eligibility import router as eligibility_router

app = FastAPI(
    title="Government Scheme Eligibility Matcher",
    description="Rules decide. AI explains. This API never lets a model decide eligibility.",
    version="0.1.0",
)

# Dev-only CORS. Tighten this before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eligibility_router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "gov-scheme-matcher-backend"}
