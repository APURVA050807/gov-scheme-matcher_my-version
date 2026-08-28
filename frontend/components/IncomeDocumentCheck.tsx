"use client";

import { useState } from "react";
import { extractIncomeFromDocument } from "@/lib/api";
import { Loader2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * PHASE 11 / PHASE 15 rule, enforced here in the UI too, not just the
 * backend: this widget NEVER silently changes the person's typed income.
 * It only shows a comparison and offers a button - the person decides.
 */
export default function IncomeDocumentCheck({
  typedIncome,
  onUseDetected,
}: {
  typedIncome: number | undefined;
  onUseDetected: (value: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<number | null | undefined>(undefined);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setDetected(undefined);
    try {
      const result = await extractIncomeFromDocument(file);
      setDetected(result.detected_income);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read that document. You can still enter your income manually above."
      );
    } finally {
      setLoading(false);
      e.target.value = ""; // allow re-uploading the same filename
    }
  }

  return (
    <div className="mt-2 rounded-card border border-line bg-white/60 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink/60 hover:text-ink">
        <Upload className="h-3.5 w-3.5" />
        Optional: upload your income certificate to auto-check this figure
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      {loading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Reading document…
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {detected !== undefined && !loading && (
        <div className="mt-2 text-xs">
          {detected === null ? (
            <p className="text-ink/50">
              Couldn&apos;t confidently find an income figure on that document.
            </p>
          ) : detected === typedIncome ? (
            <p className="flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Matches what you entered (₹{detected.toLocaleString()})
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-warn/5 p-2">
              <p className="flex items-center gap-1 text-warn">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Document shows ₹{detected.toLocaleString()}, you entered{" "}
                {typedIncome ? `₹${typedIncome.toLocaleString()}` : "nothing"}
              </p>
              <button
                type="button"
                onClick={() => onUseDetected(detected)}
                className="shrink-0 rounded-full border border-warn/40 px-2 py-1 text-warn hover:bg-warn/10"
              >
                Use this value
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
