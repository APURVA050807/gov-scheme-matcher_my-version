"""
The rule engine. This is the ONLY thing allowed to decide eligibility
(see PHASE 3 architecture rule #1 - no LLM ever decides eligibility).

Core idea: three-valued logic, not plain True/False.
    TRUE    -> condition satisfied
    FALSE   -> condition failed
    UNKNOWN -> required profile field wasn't supplied

ALL(children):  FALSE if any child FALSE, else UNKNOWN if any child UNKNOWN, else TRUE
ANY(children):  TRUE if any child TRUE, else UNKNOWN if any child UNKNOWN, else FALSE
NOT(children):  negate the ALL of children (TRUE<->FALSE, UNKNOWN stays UNKNOWN)

Top level result is then translated to the product's 3 statuses:
    TRUE    -> ELIGIBLE
    FALSE   -> NOT_ELIGIBLE
    UNKNOWN -> NEEDS_MORE_INFORMATION

This means "missing one field" never gets silently reported as
NOT_ELIGIBLE unless the profile data ALREADY fails on its own - which is
exactly PHASE 3 architecture rule #7.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Union

from models.scheme import Condition, RuleGroup, Scheme, SchemeResult
from models.profile import UserProfile
from rules.operators import evaluate_operator


class Tri(str, Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    UNKNOWN = "UNKNOWN"


@dataclass
class ConditionResult:
    field: str
    label: str
    operator: str
    expected: Any
    actual: Any
    unit: str | None
    status: str  # "SATISFIED" | "FAILED" | "MISSING"
    evidence_summary: str | None = None
    source_url: str | None = None


@dataclass
class EvalOutcome:
    tri: Tri
    checks: List[ConditionResult] = field(default_factory=list)


def _eval_condition(cond: Condition, profile: UserProfile) -> EvalOutcome:
    actual = getattr(profile, cond.field, None)
    if actual is None and cond.field not in (profile.model_extra or {}):
        # field truly absent from the profile the user submitted
        return EvalOutcome(
            tri=Tri.UNKNOWN,
            checks=[
                ConditionResult(
                    field=cond.field,
                    label=cond.label,
                    operator=cond.operator,
                    expected=cond.value,
                    actual=None,
                    unit=cond.unit,
                    status="MISSING",
                    evidence_summary=cond.evidence.evidence_summary if cond.evidence else None,
                    source_url=cond.evidence.source_url if cond.evidence else None,
                )
            ],
        )

    if actual is None:
        actual = (profile.model_extra or {}).get(cond.field)

    passed = evaluate_operator(cond.operator, actual, cond.value)
    return EvalOutcome(
        tri=Tri.TRUE if passed else Tri.FALSE,
        checks=[
            ConditionResult(
                field=cond.field,
                label=cond.label,
                operator=cond.operator,
                expected=cond.value,
                actual=actual,
                unit=cond.unit,
                status="SATISFIED" if passed else "FAILED",
                evidence_summary=cond.evidence.evidence_summary if cond.evidence else None,
                source_url=cond.evidence.source_url if cond.evidence else None,
            )
        ],
    )


def _eval_node(node: Union[RuleGroup, Condition], profile: UserProfile) -> EvalOutcome:
    if isinstance(node, Condition) or getattr(node, "type", None) == "CONDITION":
        if not isinstance(node, Condition):
            node = Condition(**node.dict()) if hasattr(node, "dict") else node
        return _eval_condition(node, profile)

    # It's a RuleGroup
    child_outcomes = [_eval_node(child, profile) for child in node.conditions]
    all_checks = [c for outcome in child_outcomes for c in outcome.checks]
    tris = [o.tri for o in child_outcomes]

    if node.type == "ALL":
        if Tri.FALSE in tris:
            result = Tri.FALSE
        elif Tri.UNKNOWN in tris:
            result = Tri.UNKNOWN
        else:
            result = Tri.TRUE
    elif node.type == "ANY":
        if Tri.TRUE in tris:
            result = Tri.TRUE
        elif Tri.UNKNOWN in tris:
            result = Tri.UNKNOWN
        else:
            result = Tri.FALSE
    elif node.type == "NOT":
        # NOT wraps an implicit ALL of its children, then negates
        if Tri.FALSE in tris:
            inner = Tri.FALSE
        elif Tri.UNKNOWN in tris:
            inner = Tri.UNKNOWN
        else:
            inner = Tri.TRUE
        result = {Tri.TRUE: Tri.FALSE, Tri.FALSE: Tri.TRUE, Tri.UNKNOWN: Tri.UNKNOWN}[inner]
    else:
        raise ValueError(f"Unknown group type: {node.type}")

    return EvalOutcome(tri=result, checks=all_checks)


_STATUS_MAP = {
    Tri.TRUE: "ELIGIBLE",
    Tri.FALSE: "NOT_ELIGIBLE",
    Tri.UNKNOWN: "NEEDS_MORE_INFORMATION",
}


def evaluate_scheme(scheme: Scheme, profile: UserProfile) -> SchemeResult:
    outcome = _eval_node(scheme.rule_logic, profile)
    missing = [c.field for c in outcome.checks if c.status == "MISSING"]
    return SchemeResult(
        scheme_id=scheme.scheme_id,
        scheme_name=scheme.scheme_name,
        status=_STATUS_MAP[outcome.tri],
        checks=[c.__dict__ for c in outcome.checks],
        missing_fields=list(dict.fromkeys(missing + scheme.missing_fields)),
        official_source_url=scheme.official_source_url,
        official_application_url=scheme.official_application_url,
        data_status=scheme.data_status,
    )


def evaluate_all_schemes(schemes: List[Scheme], profile: UserProfile) -> List[SchemeResult]:
    return [evaluate_scheme(s, profile) for s in schemes]
