# Government Scheme Eligibility Matcher

**Core principle: Rules decide. AI explains.**

This is Milestone 1 + a working results UI, tested and verified working end
to end. It is deliberately NOT the full 16-phase build — no AI explainer, no
OCR, no semantic search yet. See "What's next" below for why.

## What's real vs what's a placeholder

- **4 schemes, not 5**: PM SVANidhi, PM Vishwakarma, PMUY 2.0, Post Matric
  Scholarship for SC Students. Every condition in `backend/data/schemes.json`
  comes directly from the sourced patch data you provided — nothing invented.
- **`data_status: "PARTIAL_NEEDS_VERIFICATION"`** on every scheme, and a
  `missing_fields` list, because none of the 4 schemes have their full rule
  set (e.g. SVANidhi's income/age limits, loan slabs) or a `last_verified`
  date yet. Don't demo this as "5 verified schemes" — it isn't, yet.
- **No documents list beyond what was sourced.** Don't add fake document
  checklists to make the UI look fuller.

## Project structure

```
gov-scheme-matcher/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── models/                 # Pydantic: Scheme, Condition, UserProfile
│   ├── rules/
│   │   ├── operators.py        # EQUALS, IN, BETWEEN, etc — pure functions
│   │   └── engine.py           # 3-valued logic: TRUE/FALSE/UNKNOWN
│   ├── data/schemes.json       # the 4 real schemes
│   ├── api/eligibility.py      # POST /eligibility/check
│   └── tests/test_rule_engine.py  # 10 tests: boundaries, missing data, AND/OR/NOT
└── frontend/
    ├── app/page.tsx            # landing
    ├── app/assess/page.tsx     # profile form (3 steps)
    ├── app/results/page.tsx    # matches + why-not + per-condition reasoning
    └── lib/api.ts              # typed fetch client
```

## Why the rule engine uses 3-valued logic, not true/false

A missing profile field must never silently become "not eligible" — that's
architecture rule #7 from the plan. So every condition evaluates to
`TRUE` / `FALSE` / `UNKNOWN` (unknown = field wasn't supplied), and groups
combine those with proper three-valued AND/OR/NOT:

- `ALL`: FALSE if any child is FALSE, else UNKNOWN if any child is UNKNOWN, else TRUE
- `ANY`: TRUE if any child is TRUE, else UNKNOWN if any child is UNKNOWN, else FALSE
- `NOT`: negates TRUE/FALSE, UNKNOWN stays UNKNOWN

This is what lets a scheme with a missing field come back as
`NEEDS_MORE_INFORMATION` instead of a false "not eligible" — even inside
nested groups. Covered by `test_rule_engine.py`.

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# from the gov-scheme-matcher/ root (not backend/), because of the
# `from backend.xxx import yyy` imports:
cd ..
python3 -m uvicorn backend.main:app --reload --port 8000
```

Check it's alive: `curl http://localhost:8000/` → `{"status":"ok",...}`

Run tests:
```bash
python3 -m pytest backend/tests -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. It expects the backend at
`http://localhost:8000` (override with `NEXT_PUBLIC_API_BASE` in a
`frontend/.env.local` file if you deploy the backend elsewhere).

## Integration checklist (do this in order)

1. `cd backend && python3 -m pytest tests -v` — confirm 10/10 pass before touching anything else.
2. Start the backend (`uvicorn backend.main:app --reload --port 8000`), leave it running.
3. In a second terminal, `cd frontend && npm run dev`.
4. Open `/assess`, fill the form, submit — you should land on `/results`
   with real scheme cards (not a network error).
5. If `/results` shows a fetch error: check the backend terminal for CORS
   errors and confirm `frontend`'s origin matches `allow_origins` in
   `backend/main.py`.

## What's next (in order — don't skip ahead)

1. **Fill the missing scheme fields.** Every `missing_fields` entry in
   `schemes.json` needs a real source before you add it as a condition.
2. **Add a 5th scheme** with the same evidence-per-condition structure.
3. **Phase 8 (NEEDS_MORE_INFORMATION UX)**: the backend already returns
   this status and which fields are missing — wire a "add this detail"
   follow-up prompt in the UI instead of a dead end.
4. **Phase 9 (AI explainer)**: only after 1–3 are done. Feed it the
   `checks` array from a `SchemeResult`, nothing else — never raw documents,
   never the decision itself.
5. OCR, semantic search, auth — later, per the original phase plan.
