export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ConditionCheck = {
  field: string;
  label: string;
  operator: string;
  expected: unknown;
  actual: unknown;
  unit: string | null;
  status: "SATISFIED" | "FAILED" | "MISSING";
  evidence_summary: string | null;
  source_url: string | null;
};

export type SchemeResult = {
  scheme_id: string;
  scheme_name: string;
  status: "ELIGIBLE" | "NOT_ELIGIBLE" | "NEEDS_MORE_INFORMATION";
  checks: ConditionCheck[];
  missing_fields: string[];
  official_source_url: string;
  official_application_url: string;
  data_status: "VERIFIED" | "PARTIAL_NEEDS_VERIFICATION";
};

export type UserProfile = {
  age?: number;
  annual_household_income?: number;
  state?: string;
  occupation?: string;
  social_category?: string;
  gender?: string;
  current_education_level?: string;
  employment_type?: string;
  [key: string]: unknown;
};

export async function checkEligibility(profile: UserProfile): Promise<SchemeResult[]> {
  const res = await fetch(`${API_BASE}/eligibility/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    throw new Error(`Eligibility check failed: ${res.status}`);
  }
  const data = await res.json();
  return data.results as SchemeResult[];
}
