// import Link from "next/link";
// import { ShieldCheck, ScrollText, ArrowRight } from "lucide-react";

// export default function LandingPage() {
//   return (
//     <main className="mx-auto max-w-3xl px-6 py-20">
//       <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink/70">
//         <ShieldCheck className="h-3.5 w-3.5 text-primary" />
//         Rules decide. AI explains.
//       </div>

//       <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
//         Find government schemes you actually qualify for.
//       </h1>
//       <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/70">
//         Answer a few questions. A transparent rule engine checks you against
//         verified eligibility conditions — every rule traced back to an
//         official government source. No guessing, no black-box AI decisions.
//       </p>

//       <div className="mt-8 flex flex-wrap items-center gap-4">
//         <Link
//           href="/assess"
//           className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-700"
//         >
//           Check my eligibility
//           <ArrowRight className="h-4 w-4" />
//         </Link>
//         <span className="text-sm text-ink/50">Takes about 2 minutes</span>
//       </div>

//       <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
//         <FeatureCard
//           icon={<ScrollText className="h-5 w-5 text-primary" />}
//           title="Deterministic rules"
//           body="Eligibility is decided by code you can inspect, not a model guessing."
//         />
//         <FeatureCard
//           icon={<ShieldCheck className="h-5 w-5 text-primary" />}
//           title="Sourced, not invented"
//           body="Every condition links to the official scheme page it came from."
//         />
//         <FeatureCard
//           icon={<ArrowRight className="h-5 w-5 text-primary" />}
//           title="You apply officially"
//           body="We point you to the real government portal — we never process applications."
//         />
//       </div>
//     </main>
//   );
// }

// function FeatureCard({
//   icon,
//   title,
//   body,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   body: string;
// }) {
//   return (
//     <div className="rounded-card border border-line bg-white p-5">
//       <div className="mb-3">{icon}</div>
//       <h3 className="text-sm font-semibold text-ink">{title}</h3>
//       <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
//     </div>
//   );
// }


"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ScrollText, ArrowRight } from "lucide-react";
import TiltCard from "@/components/TiltCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingPage() {
  return (
    <main className="relative mx-auto max-w-3xl overflow-hidden px-6 py-20">
      {/* Ambient depth background - pure CSS, no WebGL */}
      <div className="orb orb-1 -top-24 -left-24 h-72 w-72 bg-primary/20" />
      <div className="orb orb-2 top-40 -right-20 h-80 w-80 bg-success/10" />

      <motion.div
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="relative mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-medium text-ink/70 backdrop-blur"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Rules decide. AI explains.
      </motion.div>

      <motion.h1
        initial="hidden"
        animate="show"
        custom={0.08}
        variants={fadeUp}
        className="relative text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
      >
        Find government schemes you actually qualify for.
      </motion.h1>

      <motion.p
        initial="hidden"
        animate="show"
        custom={0.16}
        variants={fadeUp}
        className="relative mt-4 max-w-xl text-lg leading-relaxed text-ink/70"
      >
        Answer a few questions. A transparent rule engine checks you against
        verified eligibility conditions — every rule traced back to an
        official government source. No guessing, no black-box AI decisions.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        custom={0.24}
        variants={fadeUp}
        className="relative mt-8 flex flex-wrap items-center gap-4"
      >
        <Link href="/assess">
          <motion.span
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-lg shadow-primary/25 transition hover:bg-primary-700"
          >
            Check my eligibility
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </Link>
        <span className="text-sm text-ink/50">Takes about 2 minutes</span>
      </motion.div>

      <div className="scene relative mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial="hidden" animate="show" custom={0.32} variants={fadeUp}>
          <TiltCard className="rounded-card border border-line bg-white p-5">
            <FeatureBody
              icon={<ScrollText className="h-5 w-5 text-primary" />}
              title="Deterministic rules"
              body="Eligibility is decided by code you can inspect, not a model guessing."
            />
          </TiltCard>
        </motion.div>
        <motion.div initial="hidden" animate="show" custom={0.4} variants={fadeUp}>
          <TiltCard className="rounded-card border border-line bg-white p-5">
            <FeatureBody
              icon={<ShieldCheck className="h-5 w-5 text-primary" />}
              title="Sourced, not invented"
              body="Every condition links to the official scheme page it came from."
            />
          </TiltCard>
        </motion.div>
        <motion.div initial="hidden" animate="show" custom={0.48} variants={fadeUp}>
          <TiltCard className="rounded-card border border-line bg-white p-5">
            <FeatureBody
              icon={<ArrowRight className="h-5 w-5 text-primary" />}
              title="You apply officially"
              body="We point you to the real government portal — we never process applications."
            />
          </TiltCard>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureBody({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div style={{ transform: "translateZ(30px)" }}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
    </div>
  );
}



