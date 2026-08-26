"""
Pure comparison functions. No side effects, no I/O - easy to unit test
in isolation (see tests/test_rule_engine.py, PHASE 16 boundary tests).
"""

from typing import Any


class OperatorError(Exception):
    pass


def evaluate_operator(operator: str, actual: Any, expected: Any) -> bool:
    if operator == "EQUALS":
        return actual == expected
    if operator == "NOT_EQUALS":
        return actual != expected
    if operator == "GREATER_THAN":
        return actual > expected
    if operator == "GREATER_THAN_OR_EQUAL":
        return actual >= expected
    if operator == "LESS_THAN":
        return actual < expected
    if operator == "LESS_THAN_OR_EQUAL":
        return actual <= expected
    if operator == "BETWEEN":
        low, high = expected
        return low <= actual <= high
    if operator == "IN":
        return actual in expected
    if operator == "NOT_IN":
        return actual not in expected
    raise OperatorError(f"Unknown operator: {operator}")
