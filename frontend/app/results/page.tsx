"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkEligibility, SchemeResult, UserProfile, ConditionCheck, explainScheme } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReadAloudButton, { SUPPORTED_LANGUAGES } from "@/components/ReadAloudButton";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function ResultsPage() {
  const [results, setResults] = useState<SchemeResult[] | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [rechecking, setRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  useEffect(() => {
    const rawResults = sessionStorage.getItem("scheme-matcher-results");
    const rawProfile = sessionStorage.getItem("scheme-matcher-profile");
    if (rawResults) setResults(JSON.parse(rawResults));
    if (rawProfile) setProfile(JSON.parse(rawProfile));
  }, []);

  // Called by any card's "Check again" button. We merge the newly-supplied
  // fields into the FULL profile (not just this scheme's fields) and
  // re-run eligibility for every scheme - because one answer (e.g. gender)
  // can resolve NEEDS_MORE_INFORMATION on more than one scheme at once.
  async function handleRecheck(updates: Record<string, unknown>) {
    const mergedProfile: UserProfile = { ...profile, ...updates };
    setRechecking(true);
    setRecheckError(null);
    try {
      const newResults = await checkEligibility(mergedProfile);
      setProfile(mergedProfile);
      setResults(newResults);
      sessionStorage.setItem("scheme-matcher-profile", JSON.stringify(mergedProfile));
      sessionStorage.setItem("scheme-matcher-results", JSON.stringify(newResults));
    } catch (e) {
      setRecheckError("Couldn't reach the eligibility service. Is the backend still running?");
    } finally {
      setRechecking(false);
    }
  }

  if (results === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-ink/60">No results to show yet.</p>
        <Link href="/assess" className="mt-4 inline-block text-primary underline">
          Start the assessment
        </Link>
      </main>
    );
  }

  const eligible = results.filter((r) => r.status === "ELIGIBLE");
  const needsInfo = results.filter((r) => r.status === "NEEDS_MORE_INFORMATION");
  const notEligible = results.filter((r) => r.status === "NOT_ELIGIBLE");

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-ink">Your scheme matches</h1>
      <p className="mt-1 text-ink/60">
        {eligible.length} scheme{eligible.length !== 1 ? "s" : ""} may be relevant to you
      </p>

      {recheckError && (
        <div className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {recheckError}
        </div>
      )}

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="mt-8 space-y-4"
      >
        {eligible.map((r) => (
          <motion.div key={r.scheme_id} variants={itemVariants}>
            <SchemeCard result={r} onRecheck={handleRecheck} rechecking={rechecking} />
          </motion.div>
        ))}
      </motion.div>

      {needsInfo.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            We need a bit more information
          </h2>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="mt-4 space-y-4"
          >
            {needsInfo.map((r) => (
              <motion.div key={r.scheme_id} variants={itemVariants}>
                <SchemeCard result={r} onRecheck={handleRecheck} rechecking={rechecking} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {notEligible.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            You don&apos;t currently match {notEligible.length} other scheme
            {notEligible.length !== 1 ? "s" : ""}
          </h2>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="mt-4 space-y-4"
          >
            {notEligible.map((r) => (
              <motion.div key={r.scheme_id} variants={itemVariants}>
                <SchemeCard result={r} onRecheck={handleRecheck} rechecking={rechecking} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </main>
  );
}

function statusMeta(status: SchemeResult["status"]) {
  switch (status) {
    case "ELIGIBLE":
      return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Eligible" };
    case "NOT_ELIGIBLE":
      return { icon: XCircle, color: "text-danger", bg: "bg-danger/10", label: "Not eligible" };
    default:
      return {
        icon: HelpCircle,
        color: "text-warn",
        bg: "bg-warn/10",
        label: "Needs more information",
      };
  }
}

function SchemeCard({
  result,
  onRecheck,
  rechecking,
}: {
  result: SchemeResult;
  onRecheck: (updates: Record<string, unknown>) => void;
  rechecking: boolean;
}) {
  // Auto-expand cards that need info, so the follow-up form is
  // immediately visible instead of hidden behind another click.
  const [open, setOpen] = useState(result.status === "NEEDS_MORE_INFORMATION");
  const meta = statusMeta(result.status);
  const Icon = meta.icon;
  const satisfiedCount = result.checks.filter((c) => c.status === "SATISFIED").length;
  const missingChecks = result.checks.filter((c) => c.status === "MISSING");

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${meta.color}`} />
            <span className="font-medium text-ink">{result.scheme_name}</span>
          </div>
          <div className={`mt-1 inline-flex items-center gap-1 rounded-full ${meta.bg} px-2 py-0.5 text-xs font-medium ${meta.color}`}>
            {meta.label}
            {result.checks.length > 0 && (
              <span className="text-ink/40">
                &nbsp;· {satisfiedCount}/{result.checks.length} conditions satisfied
              </span>
            )}
          </div>
          {result.data_status === "PARTIAL_NEEDS_VERIFICATION" && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-warn/80">
              <AlertTriangle className="h-3 w-3" />
              Some fields for this scheme still need official verification
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-line"
          >
            <div className="px-5 py-4">
              <ul className="space-y-3">
                {result.checks
                  .filter((c) => c.status !== "MISSING")
                  .map((c, i) => (
                    <ConditionRow key={i} check={c} />
                  ))}
              </ul>

              {missingChecks.length > 0 && (
                <MissingInfoForm
                  missingChecks={missingChecks}
                  onSubmit={onRecheck}
                  submitting={rechecking}
                />
              )}

              <ExplainBlock result={result} />

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <a
                  href={result.official_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink"
                >
                  Official source <ExternalLink className="h-3 w-3" />
                </a>
                {result.status === "ELIGIBLE" && (
                  <a
                    href={result.official_application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    Apply officially <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders one input per MISSING condition, using the check's operator and
 * expected-value type to pick a sensible input:
 *   - IN / NOT_IN with an array expected value -> dropdown of those exact options
 *   - boolean expected value -> Yes/No
 *   - number expected value -> number input
 *   - string that looks like a date (or field name contains "date") -> date input
 *   - anything else -> plain text input
 *
 * "Check again" sends only the fields the person just answered - the parent
 * merges them into the full profile and re-runs eligibility for everything.
 */
function MissingInfoForm({
  missingChecks,
  onSubmit,
  submitting,
}: {
  missingChecks: ConditionCheck[];
  onSubmit: (updates: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const allAnswered = missingChecks.every(
    (c) => values[c.field] !== undefined && values[c.field] !== ""
  );

  function setValue(field: string, value: unknown) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  return (
    <div className="mt-4 rounded-card border border-warn/30 bg-warn/5 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-warn">
        <HelpCircle className="h-4 w-4" />
        We need {missingChecks.length === 1 ? "one more detail" : `${missingChecks.length} more details`} to check this scheme
      </p>

      <div className="space-y-3">
        {missingChecks.map((check) => (
          <div key={check.field}>
            <label className="mb-1 block text-xs font-medium text-ink/70">{check.label}</label>
            <MissingFieldInput
              check={check}
              value={values[check.field]}
              onChange={(v) => setValue(check.field, v)}
            />
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered || submitting}
        onClick={() => onSubmit(values)}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {submitting ? "Checking…" : "Check again"}
      </button>
    </div>
  );
}

function MissingFieldInput({
  check,
  value,
  onChange,
}: {
  check: ConditionCheck;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const expected = check.expected;
  const looksLikeDate =
    check.field.toLowerCase().includes("date") ||
    (typeof expected === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expected));

  // IN / NOT_IN -> the expected value is the allowed list itself
  if ((check.operator === "IN" || check.operator === "NOT_IN") && Array.isArray(expected)) {
    return (
      <select
        className="input"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Select…</option>
        {expected.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
    );
  }

  if (typeof expected === "boolean") {
    return (
      <div className="flex gap-2">
        {[
          { label: "Yes", v: true },
          { label: "No", v: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              value === opt.v
                ? "border-primary bg-primary-50 text-primary-700"
                : "border-line text-ink/60 hover:border-ink/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (looksLikeDate) {
    return (
      <input
        type="date"
        className="input"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  }

  if (typeof expected === "number") {
    return (
      <input
        type="number"
        className="input"
        value={(value as number) ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={check.unit ? `Amount in ${check.unit}` : "Enter a value"}
      />
    );
  }

  return (
    <input
      type="text"
      className="input"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

function ExplainBlock({ result }: { result: SchemeResult }) {
  const [language, setLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    setLoading(true);
    setError(null);
    setExplanation(null);
    setSource(null);
    try {
      const result_ = await explainScheme(result, language.value);
      setExplanation(result_.explanation);
      setSource(result_.source);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't get an explanation right now. The eligibility result above is unaffected either way."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-card border border-primary/20 bg-primary-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary-700">
          <Sparkles className="h-4 w-4" />
          Explain this in plain language
        </p>
        <select
          className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink"
          value={language.value}
          onChange={(e) =>
            setLanguage(
              SUPPORTED_LANGUAGES.find((l) => l.value === e.target.value) ??
                SUPPORTED_LANGUAGES[0]
            )
          }
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {!explanation && !loading && (
        <button
          onClick={handleExplain}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Explain in {language.label}
        </button>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Asking AI to explain the verified result…
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-danger">{error}</p>
      )}

      {explanation && (
        <div className="mt-3">
          {source === "fallback" && (
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink/40">
              AI unavailable — showing a basic summary of the verified result
            </p>
          )}
          <p className="text-sm leading-relaxed text-ink/80">{explanation}</p>
          <div className="mt-3 flex items-center gap-2">
            <ReadAloudButton text={explanation} speechLang={language.speechLang} />
            <button
              onClick={handleExplain}
              className="text-xs text-ink/40 hover:text-ink/70"
            >
              Regenerate
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

function ConditionRow({ check }: { check: SchemeResult["checks"][number] }) {
  const statusIcon =
    check.status === "SATISFIED" ? (
      <CheckCircle2 className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-danger" />
    );

  return (
    <li className="flex items-start gap-3 text-sm">
      {statusIcon}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">{check.label}</span>
          <span className="text-ink/50">
            {check.actual === null || check.actual === undefined
              ? "not provided"
              : String(check.actual)}
            {check.unit ? ` ${check.unit}` : ""}
          </span>
        </div>
        {check.evidence_summary && (
          <p className="mt-0.5 text-xs text-ink/45">{check.evidence_summary}</p>
        )}
      </div>
    </li>
  );
}
