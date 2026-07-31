import { motion } from "framer-motion";

/**
 * The auth page's signature element: a stylized excerpt of contract text
 * with one clause redlined and annotated, exactly like a real risk finding
 * from Phase 6. This is the product's actual core value prop rendered as
 * the hero visual, instead of a generic gradient/illustration.
 */
export function ClauseShowcase() {
  return (
    <div className="relative flex h-full flex-col justify-center px-12 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md"
      >
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-paper/50">
          Clause 7.2 &middot; Confidentiality
        </p>

        <p className="font-display text-lg leading-relaxed text-paper/90">
          The Receiving Party shall maintain the confidentiality of all
          Confidential Information disclosed by the Disclosing Party{" "}
          <motion.span
            initial={{ backgroundColor: "rgba(193, 68, 14, 0)" }}
            animate={{ backgroundColor: "rgba(193, 68, 14, 0.25)" }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative inline rounded-sm px-0.5 underline decoration-risk-600 decoration-2 underline-offset-4"
          >
            in perpetuity, without limitation as to time or scope
          </motion.span>
          .
        </p>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-6 flex items-start gap-3 rounded-md border border-risk-600/30 bg-risk-600/10 px-4 py-3"
        >
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-risk-600" />
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wide text-risk-100">
              High risk &middot; Unbounded confidentiality term
            </p>
            <p className="mt-1 text-sm text-paper/70">
              No expiration date — most jurisdictions favor a defined term of
              3&ndash;5 years.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-16 font-display text-3xl font-medium leading-tight text-paper"
      >
        Understand contracts
        <br />
        in minutes, not hours.
      </motion.p>
    </div>
  );
}