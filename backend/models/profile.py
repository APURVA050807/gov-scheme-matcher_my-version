"""
User profile. Deliberately a loose dict-like model (`extra="allow"`) because
different schemes need different fields (employment_type, gender,
deprivation_category, etc). The rule engine looks up whatever field a
scheme's conditions ask for; if it's missing, that's a NEEDS_MORE_INFORMATION
case, not a crash.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserProfile(BaseModel):
    model_config = ConfigDict(extra="allow")

    age: Optional[int] = None
    annual_household_income: Optional[float] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    social_category: Optional[str] = None
    gender: Optional[str] = None
    current_education_level: Optional[str] = None
    employment_type: Optional[str] = None
    # Any other field a scheme needs (e.g. vending_start_date,
    # deprivation_category, has_tvc_certificate_or_lor) is accepted via
    # extra="allow" and simply looked up by field name at evaluation time.
