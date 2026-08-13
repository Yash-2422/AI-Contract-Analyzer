import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  FileDown,
  GitCompare,
  MessageSquareText,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/store/auth-store";

// --- Content: grounded in the app's real taxonomy, not placeholder copy ---

const CLAUSE_CATEGORIES = [
  "Payment Terms",
  "Termination",
  "Notice Period",
  "Auto-Renewal",
  "Confidentiality",
  "Non-Compete",
  "Indemnification",
  "Liability",
  "Arbitration",
  "Warranty",
  "Intellectual Property",
  "Obligations",
];

type Severity = "medium" | "high" | "critical";

interface ClauseExample {
  category: string;
  severity: Severity;
  before: string;
  flagged: string;
  after: string;
  note: string;
}

const CLAUSES: ClauseExample[] = [
  {
    category: "Auto-Renewal",
    severity: "medium",
    before:
      "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least ",
    flagged: "ninety (90) days prior to the end of the then-current term",
    after: ".",
    note: "A 90-day window is easy to miss. Mark day 275 on your calendar, or this renews without you.",
  },
  {
    category: "Indemnification",
    severity: "high",
    before:
      "Client shall indemnify, defend, and hold harmless Vendor from any and all claims, damages, liabilities, and expenses arising from Client's use of the Services, ",
    flagged: "without regard to Vendor's negligence",
    after: ".",
    note: "You'd be covering Vendor's own mistakes. Most markets cap this at gross negligence or willful misconduct.",
  },
  {
    category: "Termination",
    severity: "critical",
    before:
      "Either party may terminate this Agreement for convenience upon thirty (30) days' written notice, provided that Client shall remain ",
    flagged: "liable for one hundred percent (100%) of fees for the remaining term",
    after: ".",
    note: "\"Terminate for convenience\" isn't convenient if you still owe the full remaining balance.",
  },
];

const SEVERITY_STYLES: Record<
  Severity,
  { chip: string; mark: string; dot: string }
> = {
  medium: {
    chip: "border-gold/40 bg-gold/10 text-gold",
    mark: "decoration-gold",
    dot: "bg-gold",
  },
  high: {
    chip: "border-risk-600/30 bg-risk-50 text-risk-600",
    mark: "decoration-risk-600",
    dot: "bg-risk-600",
  },
  critical: {
    chip: "border-risk-600 bg-risk-600 text-paper",
    mark: "decoration-risk-600",
    dot: "bg-risk-600",
  },
};

const FEATURES = [
  {
    icon: ShieldAlert,
    title: "Risk detection",
    body: "Every clause gets a category and a severity score, low to critical, with a plain-English explanation and a suggested fix.",
  },
  {
    icon: MessageSquareText,
    title: "Ask the contract",
    body: "Ask about payment terms or termination in plain language. Every answer cites the exact page it came from.",
  },
  {
    icon: GitCompare,
    title: "Compare versions",
    body: "See exactly what changed between two drafts — added clauses, removed clauses, terms that quietly shifted.",
  },
  {
    icon: FileDown,
    title: "Export a report",
    body: "Turn any analysis into a clean PDF you can send to whoever needs to sign off.",
  },
];

const STEPS = [
  {
    title: "Upload",
    body: "Drop in a PDF or DOCX. Scanned pages get OCR'd automatically — no formatting to clean up first.",
  },
  {
    title: "Process",
    body: "The contract is chunked and indexed so every later question, comparison, or search is grounded in its actual text.",
  },
  {
    title: "Review",
    body: "Read the flagged clauses, ask the contract direct questions, or compare it against another draft.",
  },
];

// --- Motion variants ---

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: i * 0.08,
    },
  }),
};

function ClauseCard({
  clause,
  index,
}: {
  clause: ClauseExample;
  index: number;
}) {
  const styles = SEVERITY_STYLES[clause.severity];
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      custom={index}
      variants={fadeUp}
      className="rounded-lg border border-ink-100 bg-surface p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-ink-400">
          Clause {index + 1} · {clause.category}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${styles.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          {clause.severity} risk
        </span>
      </div>

      <p className="font-display text-base leading-relaxed text-ink-900">
        {clause.before}

        <motion.span
          initial={
            reduceMotion
              ? undefined
              : { backgroundColor: "rgba(193, 68, 14, 0)" }
          }
          whileInView={
            reduceMotion
              ? undefined
              : { backgroundColor: "rgba(193, 68, 14, 0.18)" }
          }
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: 0.4 + index * 0.08,
            duration: 0.6,
          }}
          className={`relative inline rounded-sm px-0.5 underline decoration-2 underline-offset-4 ${styles.mark}`}
        >
          {clause.flagged}
        </motion.span>

        {clause.after}
      </p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        custom={index + 1}
        variants={fadeUp}
        className="mt-4 flex items-start gap-3 rounded-md border border-ink-100 bg-ink-50 px-4 py-3"
      >
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
        />

        <p className="text-sm text-ink-600">{clause.note}</p>
      </motion.div>
    </motion.div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      navigate("/dashboard", { replace: true });
    }
  }, [accessToken, navigate]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="font-display text-lg font-medium text-ink-900">
            AI Contract Analyzer
          </p>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <Link
              to="/login"
              className="text-sm font-medium text-ink-600 hover:text-ink-900"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-emerald-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <motion.p
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
          className="mb-4 font-mono text-xs uppercase tracking-widest text-emerald-600"
        >
          AI Contract Analyzer
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="font-display text-4xl font-medium leading-tight text-ink-900 sm:text-5xl"
        >
          Find what's buried
          <br />
          before you sign.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mx-auto mt-5 max-w-xl text-lg text-ink-600"
        >
          Upload a contract and get every risky clause flagged, explained, and
          cited to the page — in minutes, not a full read-through.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-emerald-700"
          >
            Analyze your first contract
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* FIXED: missing opening <a> tag */}
          <a
            href="#how-it-works"
            className="rounded-md border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-50"
          >
            See how it works
          </a>
        </motion.div>
      </section>

      {/* Signature element: the living redline */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="mb-8 text-center font-display text-2xl text-ink-900"
        >
          This is what we catch.
        </motion.h2>

        <div className="space-y-5">
          {CLAUSES.map((clause, i) => (
            <ClauseCard
              key={clause.category}
              clause={clause}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Category taxonomy */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-5 text-center font-mono text-xs uppercase tracking-widest text-ink-400">
            Every finding is categorized
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {CLAUSE_CATEGORIES.map((label) => (
              <span
                key={label}
                className="rounded-full border border-ink-100 bg-surface px-3 py-1 text-xs font-medium text-ink-600"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-4xl px-6 py-24"
      >
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="mb-12 text-center font-display text-2xl text-ink-900"
        >
          How it works
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              custom={i}
              variants={fadeUp}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-600">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-2 font-display text-lg text-ink-900">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-100 bg-ink-50/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                custom={i}
                variants={fadeUp}
                className="rounded-lg border border-ink-100 bg-surface p-6"
              >
                <Icon className="h-5 w-5 text-emerald-600" />

                <h3 className="mt-3 font-display text-lg text-ink-900">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <UploadCloud className="mx-auto mb-4 h-8 w-8 text-ink-400" />

          <h2 className="font-display text-2xl text-ink-900 sm:text-3xl">
            Stop reading contracts twice.
          </h2>

          <p className="mx-auto mt-3 max-w-md text-ink-600">
            Upload one and see what it finds. No card required to try it.
          </p>

          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-emerald-700"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-ink-400">
          <p>AI Contract Analyzer</p>

          <div className="flex gap-5">
            <Link
              to="/login"
              className="hover:text-ink-900"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="hover:text-ink-900"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}