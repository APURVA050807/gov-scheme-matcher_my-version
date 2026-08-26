"""
Data models for a government scheme and its eligibility rules.

Design note: a "rule" is a tree of conditions and groups (ALL / ANY / NOT).
Leaf nodes are single conditions ("age BETWEEN 18 AND 25").
This mirrors PHASE 2 of the project plan on purpose - it is what lets the
engine return NEEDS_MORE_INFORMATION instead of just true/false.
"""

from __future__ import annotations
from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field


# ---- Leaf condition -------------------------------------------------------

Operator = Literal[
    "EQUALS",
    "NOT_EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BETWEEN",
    "IN",
    "NOT_IN",
]


class Evidence(BaseModel):
    source_title: str
    source_url: str
    publisher: str
    evidence_summary: str
    last_verified: Optional[str] = None  # ISO date string; None = not yet verified


class Condition(BaseModel):
    type: Literal["CONDITION"] = "CONDITION"
    field: str  # key into the user's profile, e.g. "age", "annual_income"
    operator: Operator
    value: Union[str, int, float, bool, List[Union[str, int, float]]]
    label: str  # human-readable label shown in the UI, e.g. "Age"
    unit: Optional[str] = None  # e.g. "INR", "years"
    evidence: Optional[Evidence] = None  # None is a red flag: unsourced rule


# ---- Groups (recursive) ----------------------------------------------------

class RuleGroup(BaseModel):
    type: Literal["ALL", "ANY", "NOT"]
    conditions: List[Union["RuleGroup", Condition]]


RuleGroup.model_rebuild()


# ---- Scheme -----------------------------------------------------------------

class SchemeDocument(BaseModel):
    name: str
    required: bool = True
    notes: Optional[str] = None


class Scheme(BaseModel):
    scheme_id: str
    scheme_name: str
    summary: str
    beneficiary_type: str
    rule_logic: RuleGroup
    required_documents: List[SchemeDocument] = Field(default_factory=list)
    official_source_url: str
    official_application_url: str
    last_verified: Optional[str] = None
    data_status: Literal["VERIFIED", "PARTIAL_NEEDS_VERIFICATION"] = (
        "PARTIAL_NEEDS_VERIFICATION"
    )
    missing_fields: List[str] = Field(default_factory=list)


class SchemeResult(BaseModel):
    scheme_id: str
    scheme_name: str
    status: Literal["ELIGIBLE", "NOT_ELIGIBLE", "NEEDS_MORE_INFORMATION"]
    checks: list  # list[ConditionResult], defined in rules/engine.py
    missing_fields: List[str]
    official_source_url: str
    official_application_url: str
    data_status: str
