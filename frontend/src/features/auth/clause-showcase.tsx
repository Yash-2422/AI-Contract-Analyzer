import { motion, useReducedMotion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

/**
 * The auth page's signature element: a stylized excerpt of contract text
 * with one clause redlined and annotated, exactly like a real risk finding.
 * The product's actual core value prop is the hero visual - not a generic
 * gradient illustration.
 */
export function ClauseShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative max-w-xl">
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-primary-foreground/65"
      >
        <span className="h-px w-8 bg-champagne/50" />
        A closer read · Clause 7.2
      </motion.p>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-primary-hover/80 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-primary-foreground/65">
            Mutual NDA · Confidentiality
          </span>
          <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-primary-foreground/65">
            Excerpt 02
          </span>
        </div>

        <p className="font-display text-[1.15rem] leading-[1.8] text-primary-foreground/88">
          The Receiving Party shall maintain the confidentiality of all Confidential
          Information disclosed by the Disclosing Party{" "}
          <motion.span
            initial={reduceMotion ? false : { backgroundColor: "rgba(182, 109, 80, 0)" }}
            animate={{ backgroundColor: "rgba(182, 109, 80, 0.28)" }}
            transition={{ delay: 0.55, duration: 0.55 }}
            className="relative inline rounded-sm px-0.5 text-champagne underline decoration-accent decoration-2 underline-offset-4"
          >
            in perpetuity, without limitation as to time or scope
          </motion.span>
          .
        </p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-6 flex items-start gap-3 rounded-lg border border-accent/25 bg-accent/10 px-4 py-3"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
          <div>
            <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.12em] text-champagne">
              High risk · Unbounded confidentiality term
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-primary-foreground/72">
              No expiration date — most jurisdictions favor a defined term of 3–5
              years.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10"
      >
        <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-[-0.025em] text-primary-foreground xl:text-[3.25rem]">
          Understand contracts
          <br />
          <span className="italic text-champagne">in minutes, not hours.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70">
          Clause-level risk, plain-English summaries, and answers grounded in the
          document itself — without a full read-through.
        </p>
      </motion.div>
    </div>
  );
}
