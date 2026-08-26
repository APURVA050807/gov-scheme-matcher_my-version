// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { checkEligibility, UserProfile } from "@/lib/api";
// import { Loader2 } from "lucide-react";

// const STEPS = ["basics", "location_work", "documents"] as const;
// type Step = (typeof STEPS)[number];

// export default function AssessPage() {
//   const router = useRouter();
//   const [stepIndex, setStepIndex] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [profile, setProfile] = useState<UserProfile>({});

//   const step: Step = STEPS[stepIndex];

//   function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
//     setProfile((p) => ({ ...p, [key]: value }));
//   }

//   async function handleSubmit() {
//     setLoading(true);
//     setError(null);
//     try {
//       const results = await checkEligibility(profile);
//       sessionStorage.setItem("scheme-matcher-results", JSON.stringify(results));
//       sessionStorage.setItem("scheme-matcher-profile", JSON.stringify(profile));
//       router.push("/results");
//     } catch (e) {
//       setError(
//         "Couldn't reach the eligibility service. Is the backend running on localhost:8000?"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="mx-auto max-w-xl px-6 py-16">
//       <ProgressDots current={stepIndex} total={STEPS.length} />

//       {step === "basics" && (
//         <Section title="A few basics" subtitle="This is used only to check eligibility rules.">
//           <Field label="Age">
//             <input
//               type="number"
//               className="input"
//               value={profile.age ?? ""}
//               onChange={(e) => update("age", e.target.value ? Number(e.target.value) : undefined)}
//               placeholder="e.g. 24"
//             />
//           </Field>
//           <Field label="Gender">
//             <select
//               className="input"
//               value={profile.gender ?? ""}
//               onChange={(e) => update("gender", e.target.value || undefined)}
//             >
//               <option value="">Select…</option>
//               <option value="female">Female</option>
//               <option value="male">Male</option>
//               <option value="other">Other</option>
//             </select>
//           </Field>
//           <Field label="Annual household income (INR)">
//             <input
//               type="number"
//               className="input"
//               value={profile.annual_household_income ?? ""}
//               onChange={(e) =>
//                 update(
//                   "annual_household_income",
//                   e.target.value ? Number(e.target.value) : undefined
//                 )
//               }
//               placeholder="e.g. 180000"
//             />
//           </Field>
//         </Section>
//       )}

//       {step === "location_work" && (
//         <Section title="Location & category" subtitle="Some schemes are restricted by these.">
//           <Field label="State">
//             <input
//               className="input"
//               value={profile.state ?? ""}
//               onChange={(e) => update("state", e.target.value || undefined)}
//               placeholder="e.g. Haryana"
//             />
//           </Field>
//           <Field label="Social category">
//             <select
//               className="input"
//               value={profile.social_category ?? ""}
//               onChange={(e) => update("social_category", e.target.value || undefined)}
//             >
//               <option value="">Select…</option>
//               <option value="SC">SC</option>
//               <option value="ST">ST</option>
//               <option value="OBC">OBC</option>
//               <option value="General">General</option>
//             </select>
//           </Field>
//           <Field label="Current education level">
//             <select
//               className="input"
//               value={profile.current_education_level ?? ""}
//               onChange={(e) => update("current_education_level", e.target.value || undefined)}
//             >
//               <option value="">Select…</option>
//               <option value="class_11">Class 11</option>
//               <option value="class_12">Class 12</option>
//               <option value="undergraduate">Undergraduate</option>
//               <option value="postgraduate">Postgraduate</option>
//               <option value="not_studying">Not currently studying</option>
//             </select>
//           </Field>
//           <Field label="Occupation / employment type">
//             <select
//               className="input"
//               value={(profile.employment_type as string) ?? ""}
//               onChange={(e) => update("employment_type", e.target.value || undefined)}
//             >
//               <option value="">Select…</option>
//               <option value="street_vendor">Street vendor</option>
//               <option value="artisan">Artisan / craftsperson</option>
//               <option value="salaried">Salaried</option>
//               <option value="unemployed">Unemployed</option>
//               <option value="other">Other</option>
//             </select>
//           </Field>
//         </Section>
//       )}

//       {step === "documents" && (
//         <Section title="A couple more details" subtitle="Only asked where a scheme needs it.">
//           <Field label="Household deprivation category (for LPG/Ujjwala scheme, if applicable)">
//             <select
//               className="input"
//               value={(profile.deprivation_category as string) ?? ""}
//               onChange={(e) => update("deprivation_category", e.target.value || undefined)}
//             >
//               <option value="">Not applicable / skip</option>
//               <option value="SC Households">SC Households</option>
//               <option value="ST Households">ST Households</option>
//               <option value="Antyodaya Anna Yojana (AAY)">Antyodaya Anna Yojana (AAY)</option>
//               <option value="Poor Household as per 14-point declaration">
//                 Poor Household (14-point declaration)
//               </option>
//             </select>
//           </Field>
//           <Field label="Do you have a Certificate of Vending / Letter of Recommendation? (street vendors only)">
//             <YesNoUnset
//               value={profile.has_tvc_certificate_or_lor as boolean | undefined}
//               onChange={(v) => update("has_tvc_certificate_or_lor", v)}
//             />
//           </Field>
//         </Section>
//       )}

//       {error && (
//         <div className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
//           {error}
//         </div>
//       )}

//       <div className="mt-8 flex items-center justify-between">
//         <button
//           className="text-sm font-medium text-ink/50 hover:text-ink disabled:opacity-30"
//           disabled={stepIndex === 0}
//           onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
//         >
//           Back
//         </button>

//         {stepIndex < STEPS.length - 1 ? (
//           <button
//             className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
//             onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
//           >
//             Continue
//           </button>
//         ) : (
//           <button
//             className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
//             disabled={loading}
//             onClick={handleSubmit}
//           >
//             {loading && <Loader2 className="h-4 w-4 animate-spin" />}
//             {loading ? "Checking…" : "See my matches"}
//           </button>
//         )}
//       </div>
//     </main>
//   );
// }

// function ProgressDots({ current, total }: { current: number; total: number }) {
//   return (
//     <div className="mb-10 flex gap-2">
//       {Array.from({ length: total }).map((_, i) => (
//         <div
//           key={i}
//           className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-line"}`}
//         />
//       ))}
//     </div>
//   );
// }

// function Section({
//   title,
//   subtitle,
//   children,
// }: {
//   title: string;
//   subtitle: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-ink">{title}</h2>
//       <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
//       <div className="mt-6 space-y-5">{children}</div>
//     </div>
//   );
// }

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
//       {children}
//     </label>
//   );
// }

// function YesNoUnset({
//   value,
//   onChange,
// }: {
//   value: boolean | undefined;
//   onChange: (v: boolean | undefined) => void;
// }) {
//   return (
//     <div className="flex gap-2">
//       {[
//         { label: "Yes", v: true },
//         { label: "No", v: false },
//         { label: "Not applicable", v: undefined },
//       ].map((opt) => (
//         <button
//           key={opt.label}
//           type="button"
//           onClick={() => onChange(opt.v)}
//           className={`rounded-full border px-4 py-1.5 text-sm ${
//             value === opt.v
//               ? "border-primary bg-primary-50 text-primary-700"
//               : "border-line text-ink/60 hover:border-ink/30"
//           }`}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// }





"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkEligibility, UserProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = ["basics", "location_work", "documents"] as const;
type Step = (typeof STEPS)[number];

export default function AssessPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});

  const step: Step = STEPS[stepIndex];

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const results = await checkEligibility(profile);
      sessionStorage.setItem("scheme-matcher-results", JSON.stringify(results));
      sessionStorage.setItem("scheme-matcher-profile", JSON.stringify(profile));
      router.push("/results");
    } catch (e) {
      setError(
        "Couldn't reach the eligibility service. Is the backend running on localhost:8000?"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <ProgressDots current={stepIndex} total={STEPS.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
      {step === "basics" && (
        <Section title="A few basics" subtitle="This is used only to check eligibility rules.">
          <Field label="Age">
            <input
              type="number"
              className="input"
              value={profile.age ?? ""}
              onChange={(e) => update("age", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 24"
            />
          </Field>
          <Field label="Gender">
            <select
              className="input"
              value={profile.gender ?? ""}
              onChange={(e) => update("gender", e.target.value || undefined)}
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Annual household income (INR)">
            <input
              type="number"
              className="input"
              value={profile.annual_household_income ?? ""}
              onChange={(e) =>
                update(
                  "annual_household_income",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="e.g. 180000"
            />
          </Field>
        </Section>
      )}

      {step === "location_work" && (
        <Section title="Location & category" subtitle="Some schemes are restricted by these.">
          <Field label="State">
            <input
              className="input"
              value={profile.state ?? ""}
              onChange={(e) => update("state", e.target.value || undefined)}
              placeholder="e.g. Haryana"
            />
          </Field>
          <Field label="Social category">
            <select
              className="input"
              value={profile.social_category ?? ""}
              onChange={(e) => update("social_category", e.target.value || undefined)}
            >
              <option value="">Select…</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="General">General</option>
            </select>
          </Field>
          <Field label="Current education level">
            <select
              className="input"
              value={profile.current_education_level ?? ""}
              onChange={(e) => update("current_education_level", e.target.value || undefined)}
            >
              <option value="">Select…</option>
              <option value="class_11">Class 11</option>
              <option value="class_12">Class 12</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="not_studying">Not currently studying</option>
            </select>
          </Field>
          <Field label="Occupation / employment type">
            <select
              className="input"
              value={(profile.employment_type as string) ?? ""}
              onChange={(e) => update("employment_type", e.target.value || undefined)}
            >
              <option value="">Select…</option>
              <option value="street_vendor">Street vendor</option>
              <option value="artisan">Artisan / craftsperson</option>
              <option value="salaried">Salaried</option>
              <option value="unemployed">Unemployed</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </Section>
      )}

      {step === "documents" && (
        <Section title="A couple more details" subtitle="Only asked where a scheme needs it.">
          <Field label="Household deprivation category (for LPG/Ujjwala scheme, if applicable)">
            <select
              className="input"
              value={(profile.deprivation_category as string) ?? ""}
              onChange={(e) => update("deprivation_category", e.target.value || undefined)}
            >
              <option value="">Not applicable / skip</option>
              <option value="SC Households">SC Households</option>
              <option value="ST Households">ST Households</option>
              <option value="Antyodaya Anna Yojana (AAY)">Antyodaya Anna Yojana (AAY)</option>
              <option value="Poor Household as per 14-point declaration">
                Poor Household (14-point declaration)
              </option>
            </select>
          </Field>
          <Field label="Do you have a Certificate of Vending / Letter of Recommendation? (street vendors only)">
            <YesNoUnset
              value={profile.has_tvc_certificate_or_lor as boolean | undefined}
              onChange={(v) => update("has_tvc_certificate_or_lor", v)}
            />
          </Field>
        </Section>
      )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          className="text-sm font-medium text-ink/50 hover:text-ink disabled:opacity-30"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>

        {stepIndex < STEPS.length - 1 ? (
          <button
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          >
            Continue
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Checking…" : "See my matches"}
          </button>
        )}
      </div>
    </main>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-10 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-line"}`}
        />
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

function YesNoUnset({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { label: "Yes", v: true },
        { label: "No", v: false },
        { label: "Not applicable", v: undefined },
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
