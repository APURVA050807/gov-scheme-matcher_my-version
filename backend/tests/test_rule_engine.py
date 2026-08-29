"""
PHASE 16 discipline: boundary conditions, missing info, and NOT logic.
Run with:  pytest backend/tests -v
"""
import pytest
from models.scheme import Scheme
from models.profile import UserProfile
from rules.engine import evaluate_scheme

INCOME_SCHEME = Scheme(
    scheme_id="TEST-001",
    scheme_name="Test Income Scheme",
    summary="test",
    beneficiary_type="test",
    official_source_url="https://example.gov.in",
    official_application_url="https://example.gov.in",
    rule_logic={
        "type": "ALL",
        "conditions": [
            {
                "type": "CONDITION",
                "field": "annual_household_income",
                "operator": "LESS_THAN_OR_EQUAL",
                "value": 250000,
                "label": "Annual income",
            }
        ],
    },
)


def test_income_exactly_at_limit_is_eligible():
    profile = UserProfile(annual_household_income=250000)
    result = evaluate_scheme(INCOME_SCHEME, profile)
    assert result.status == "ELIGIBLE"


def test_income_one_rupee_over_limit_is_not_eligible():
    profile = UserProfile(annual_household_income=250001)
    result = evaluate_scheme(INCOME_SCHEME, profile)
    assert result.status == "NOT_ELIGIBLE"


def test_income_one_rupee_under_limit_is_eligible():
    profile = UserProfile(annual_household_income=249999)
    result = evaluate_scheme(INCOME_SCHEME, profile)
    assert result.status == "ELIGIBLE"


def test_missing_field_is_needs_more_information_not_not_eligible():
    profile = UserProfile()  # income never supplied
    result = evaluate_scheme(INCOME_SCHEME, profile)
    assert result.status == "NEEDS_MORE_INFORMATION"
    assert "annual_household_income" in result.missing_fields


ANY_SCHEME = Scheme(
    scheme_id="TEST-002",
    scheme_name="Test ANY Scheme",
    summary="test",
    beneficiary_type="test",
    official_source_url="https://example.gov.in",
    official_application_url="https://example.gov.in",
    rule_logic={
        "type": "ANY",
        "conditions": [
            {"type": "CONDITION", "field": "state", "operator": "EQUALS", "value": "Haryana", "label": "State"},
            {"type": "CONDITION", "field": "state", "operator": "EQUALS", "value": "Delhi", "label": "State"},
        ],
    },
)


def test_any_group_true_if_one_branch_true_even_if_other_missing():
    # ANY: one branch is definitively TRUE, so the group is TRUE
    # regardless of whether other branches could be evaluated.
    profile = UserProfile(state="Haryana")
    result = evaluate_scheme(ANY_SCHEME, profile)
    assert result.status == "ELIGIBLE"


NOT_SCHEME = Scheme(
    scheme_id="TEST-003",
    scheme_name="Test NOT Scheme",
    summary="test",
    beneficiary_type="test",
    official_source_url="https://example.gov.in",
    official_application_url="https://example.gov.in",
    rule_logic={
        "type": "NOT",
        "conditions": [
            {
                "type": "CONDITION",
                "field": "has_existing_loan",
                "operator": "EQUALS",
                "value": True,
                "label": "Existing loan",
            }
        ],
    },
)


def test_not_condition_blocks_when_excluding_fact_is_true():
    profile = UserProfile(has_existing_loan=True)
    result = evaluate_scheme(NOT_SCHEME, profile)
    assert result.status == "NOT_ELIGIBLE"


def test_not_condition_passes_when_excluding_fact_is_false():
    profile = UserProfile(has_existing_loan=False)
    result = evaluate_scheme(NOT_SCHEME, profile)
    assert result.status == "ELIGIBLE"


def test_not_condition_is_unknown_when_fact_missing():
    profile = UserProfile()
    result = evaluate_scheme(NOT_SCHEME, profile)
    assert result.status == "NEEDS_MORE_INFORMATION"


def test_in_operator_for_category_list():
    scheme = Scheme(
        scheme_id="TEST-004",
        scheme_name="Test IN Scheme",
        summary="test",
        beneficiary_type="test",
        official_source_url="https://example.gov.in",
        official_application_url="https://example.gov.in",
        rule_logic={
            "type": "ALL",
            "conditions": [
                {
                    "type": "CONDITION",
                    "field": "social_category",
                    "operator": "IN",
                    "value": ["SC", "ST"],
                    "label": "Category",
                }
            ],
        },
    )
    assert evaluate_scheme(scheme, UserProfile(social_category="SC")).status == "ELIGIBLE"
    assert evaluate_scheme(scheme, UserProfile(social_category="OBC")).status == "NOT_ELIGIBLE"


def test_real_scheme_data_loads_and_evaluates():
    """Sanity check against the actual verified scheme dataset."""
    import json
    from pathlib import Path

    data_path = Path(__file__).resolve().parent.parent / "data" / "schemes.json"
    raw = json.loads(data_path.read_text())
    schemes = [Scheme(**item) for item in raw]
    assert len(schemes) == 4

    profile = UserProfile(
        gender="female",
        age=25,
        deprivation_category="SC Households",
    )
    results = {r.scheme_id: r for r in [evaluate_scheme(s, profile) for s in schemes]}
    assert results["SCH-005"].status == "ELIGIBLE"  # PMUY
    # SVANidhi fields weren't supplied -> must ask for more info, not reject
    assert results["SCH-003"].status == "NEEDS_MORE_INFORMATION"
