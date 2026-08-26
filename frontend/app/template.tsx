"use client";

import { motion } from "framer-motion";

/**
 * app/template.tsx is special in Next.js App Router: unlike layout.tsx,
 * it REMOUNTS on every route change - which is exactly what we need to
 * replay an enter animation each time you navigate between pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
