import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileDown,
  GitCompare,
  LockKeyhole,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/logo";
import { Eyebrow } from "@/components/ui/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const CLAUSE_CATEGORIES = [
  "Payment terms",
  "Termination",
  "Notice period",
  "Auto-renewal",
  "Confidentiality",
  "Non-compete",
  "Indemnification",
  "Liability",
  "Arbitration",
  "Warranty",
  "Intellectual property",
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
    category: "Auto-renewal",
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
  { chip: string; highlight: string; border: string; dot: string; label: string }
> = {
  medium: {
    chip: "border-gold/30 bg-gold/10 text-gold",
    highlight: "bg-gold/15 decoration-gold/70",
    border: "border-l-gold",
    dot: "bg-gold",
    label: "Medium risk",
  },
  high: {
    chip: "border-risk-600/20 bg-risk-50 text-risk-600",
    highlight: "bg-risk-600/10 decoration-risk-600/60",
    border: "border-l-risk-600",
    dot: "bg-risk-600",
    label: "High risk",
  },
  critical: {
    chip: "border-risk-600 bg-risk-600 text-white",
    highlight: "bg-risk-600/15 decoration-risk-600",
    border: "border-l-risk-600",
    dot: "bg-risk-600",
    label: "Critical risk",
  },
};

const FEATURES = [
  {
    icon: ShieldAlert,
    number: "01",
    title: "Risk, in context",
    body: "Every finding gets a clause category, a severity, a plain-English explanation, and a suggested fix.",
  },
  {
    icon: MessageSquareText,
    number: "02",
    title: "Ask the document",
    body: "Put a question to the contract and get an answer grounded in its text, with the page it came from.",
  },
  {
    icon: GitCompare,
    number: "03",
    title: "Compare two drafts",
    body: "See added, removed, and quietly modified clauses — before a redline becomes a signature.",
  },
  {
    icon: FileDown,
    number: "04",
    title: "A clean paper trail",
    body: "Export a considered PDF summary, risk report, or clause index for whoever needs to sign off.",
  },
];

const STEPS = [
  {
    title: "Upload",
    body: "Drop in a PDF or DOCX. Scanned pages are OCR'd automatically — no pre-cleaning required.",
  },
  {
    title: "Read",
    body: "The contract is chunked and indexed, so every answer, comparison, and search is grounded in its actual language.",
  },
  {
    title: "Review",
    body: "Read the flagged clauses, ask direct questions, or compare the draft against a prior version.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function ClauseCard({ clause, index }: { clause: ClauseExample; index: number }) {
  const styles = SEVERITY_STYLES[clause.severity];
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className={cn(
        "relative rounded-xl border border-ink-100 border-l-2 bg-surface p-5 shadow-card sm:p-6",
        styles.border,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-400">
          Clause {String(index + 1).padStart(2, "0")} · {clause.category}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[0.58rem] font-medium uppercase tracking-[0.1em]",
            styles.chip,
          )}
        >
          <span className={cn("h-1 w-1 rounded-full", styles.dot)} />
          {styles.label}
        </span>
      </div>

      <p className="font-display text-[1.02rem] leading-[1.75] text-ink-900">
        {clause.before}
        <motion.span
          initial={reduceMotion ? false : { backgroundColor: "rgba(182, 109, 80, 0)" }}
          whileInView={{ backgroundColor: "rgba(182, 109, 80, 0.16)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.25 + index * 0.07, duration: 0.55 }}
          className={cn(
            "relative inline rounded-sm px-0.5 underline decoration-2 underline-offset-4",
            styles.highlight,
          )}
        >
          {clause.flagged}
        </motion.span>
        {clause.after}
      </p>

      <div className="mt-4 flex items-start gap-2.5 border-t border-ink-100 pt-4">
        <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
        <p className="text-[0.8125rem] leading-relaxed text-ink-400">{clause.note}</p>
      </div>
    </motion.article>
  );
}


function HeroDocument() {
  const reduceMotion = useReducedMotion();
  const benchRef = useRef<HTMLDivElement>(null);
  const rxValue = useMotionValue(0);
  const ryValue = useMotionValue(0);
  const rx = useSpring(rxValue, { stiffness: 170, damping: 24, mass: 0.7 });
  const ry = useSpring(ryValue, { stiffness: 170, damping: 24, mass: 0.7 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || !benchRef.current || event.pointerType !== "mouse") return;
    const rect = benchRef.current.getBoundingClientRect();
    rxValue.set((((event.clientY - rect.top) / rect.height) - 0.5) * -4);
    ryValue.set((((event.clientX - rect.left) / rect.width) - 0.5) * 5);
  }
  function resetTilt() { rxValue.set(0); ryValue.set(0); }
  const reveal = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <div ref={benchRef} onPointerMove={handlePointerMove} onPointerLeave={resetTilt} className="relative mx-auto w-full max-w-[36rem] [perspective:1400px]">
      <div className="absolute inset-5 rounded-[1.75rem] bg-primary/[0.06] blur-3xl" aria-hidden="true" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative rounded-[1.5rem] border border-white/10 bg-[#13211f] p-3 shadow-[0_35px_90px_-35px_rgb(0_0_0_/_0.8)] sm:p-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3 text-white/60">
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em]"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-champagne" />Sample contract · Meridian MSA.pdf</span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-white/35">14 pages</span>
        </div>
        <div className="relative mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="relative overflow-hidden rounded-xl border border-ink-100/80 bg-surface-raised p-5 shadow-lift sm:p-6">
            <div className="absolute left-0 top-0 h-full w-1 bg-accent/25" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3 border-b border-ink-100 pb-4">
              <div><p className="font-mono text-[0.53rem] uppercase tracking-[0.16em] text-ink-400">Master services agreement</p><h3 className="mt-1.5 font-display text-xl leading-tight text-ink-900">Northwind × Meridian</h3></div>
              <motion.div {...reveal(0.72)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/30 bg-brass/10"><span className="font-display text-base text-brass">72</span></motion.div>
            </div>
            <div className="relative mt-5 space-y-4 font-display text-[0.79rem] leading-[1.8] text-ink-600">
              <motion.div {...reveal(0.42)} className="relative rounded-md border-l-2 border-risk-600 bg-risk-600/[0.07] px-3 py-2"><span className="absolute -left-1.5 top-2 h-2 w-2 rounded-full bg-risk-600 ring-4 ring-risk-600/10" /><span className="mr-1 font-mono text-[0.5rem] uppercase tracking-widest text-brass">7.2</span>The Receiving Party shall maintain confidentiality <mark className="rounded-sm bg-risk-600/15 px-0.5 text-ink-900 underline decoration-risk-600/60 decoration-1 underline-offset-4">in perpetuity, without limitation as to time or scope</mark>.</motion.div>
              <motion.div {...reveal(0.58)} className="relative rounded-md border-l-2 border-gold bg-gold/[0.08] px-3 py-2"><span className="absolute -left-1.5 top-2 h-2 w-2 rounded-full bg-gold ring-4 ring-gold/10" /><span className="mr-1 font-mono text-[0.5rem] uppercase tracking-widest text-brass">9.1</span>Either party may terminate upon thirty days' notice, provided that Client remains <mark className="rounded-sm bg-gold/20 px-0.5 text-ink-900 underline decoration-gold/70 decoration-1 underline-offset-4">liable for all fees through the current term</mark>.</motion.div>
              <motion.p {...reveal(0.7)} className="px-3 text-ink-400/80"><span className="mr-1 font-mono text-[0.5rem] uppercase tracking-widest text-brass">11.4</span>Neither party shall disclose the terms of this Agreement except as required by law.</motion.p>
            </div>
            <motion.div {...reveal(0.84)} className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 font-mono text-[0.52rem] uppercase tracking-[0.13em] text-ink-400"><span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-primary" />Page-cited findings</span><span className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" />Sample only</span></motion.div>
            {!reduceMotion && <motion.div aria-hidden="true" initial={{ top: "-10%" }} animate={{ top: "110%" }} transition={{ duration: 2.8, delay: 0.35, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }} className="pointer-events-none absolute left-0 right-0 z-10 h-16 bg-gradient-to-b from-transparent via-champagne/20 to-transparent" />}
          </div>
          <div className="flex flex-col gap-3">
            <motion.div {...reveal(0.62)} className="rounded-xl border border-white/10 bg-white/[0.045] p-3.5 text-white"><div className="flex items-center justify-between"><span className="font-mono text-[0.52rem] uppercase tracking-[0.13em] text-white/45">Analysis status</span><span className="h-1.5 w-1.5 rounded-full bg-champagne" /></div><p className="mt-2 font-display text-lg">Findings ready</p><p className="mt-1 text-[0.65rem] leading-relaxed text-white/45">3 clauses need a closer look.</p></motion.div>
            <motion.div {...reveal(0.78)} className="rounded-xl border border-risk-600/25 bg-risk-600/[0.12] p-3.5 text-white"><div className="flex items-center gap-2 text-risk-600"><ShieldAlert className="h-3.5 w-3.5" /><span className="font-mono text-[0.52rem] uppercase tracking-[0.12em]">High risk</span></div><p className="mt-2 text-xs font-medium text-white/90">Unbounded confidentiality</p><p className="mt-1.5 text-[0.65rem] leading-relaxed text-white/50">Suggested term: 3–5 years.</p></motion.div>
            <motion.div {...reveal(0.94)} className="mt-auto rounded-xl border border-brass/20 bg-brass/[0.08] p-3.5 text-white"><p className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-champagne">Citation confirmed</p><p className="mt-2 font-display text-lg text-champagne">Page 7 · Clause 7.2</p><p className="mt-1 text-[0.65rem] leading-relaxed text-white/50">Explanation linked to the exact language.</p></motion.div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-2 pt-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-white/35"><span>AI contract review</span><span>Illustrative sample · not legal advice</span></div>
      </motion.div>
    </div>
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
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-ink-100/80 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="min-w-0">
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-7 text-[0.8125rem] text-ink-600 md:flex">
            <a href="#what-we-catch" className="transition-colors hover:text-ink-900">
              What we catch
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-ink-900">
              How it works
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden text-[0.8125rem] font-medium text-ink-600 transition-colors hover:text-ink-900 sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
            >
              Get started
            </Link>
            <Link
              to="/register"
              className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}
              aria-label="Get started"
            >
              Start
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-ink-100">
        <div className="pointer-events-none absolute inset-0 paper-texture opacity-70" />
        <div className="relative mx-auto grid max-w-6xl gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24">          <div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow className="mb-5">Contract intelligence for careful people</Eyebrow>
            <h1 className="max-w-xl font-display text-[2.9rem] font-medium leading-[0.98] tracking-[-0.035em] text-ink-900 sm:text-[3.8rem] lg:text-[4.15rem]">
              Find what's buried
              <br />
              <span className="italic text-primary">before you sign.</span>
            </h1>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-ink-600"
          >
            Upload a contract and get every risky clause flagged, explained, and
            cited to the page — in minutes, not a full read-through.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/register" className={cn(buttonVariants({ size: "lg" }), "group")}>
              Analyze your first contract
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "group")}
            >
              See how it works
              <ArrowUpRight className="h-4 w-4 text-ink-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.6875rem] text-ink-400"
          >
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> No card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> PDF & DOCX
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> Page-cited answers
            </span>
          </motion.div>
        </div>

          <HeroDocument />
        </div>
      </section>

      <section className="border-b border-white/10 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="shrink-0 font-mono text-[0.6rem] font-medium uppercase tracking-[0.22em] text-primary-foreground/60">Every finding is categorized</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {CLAUSE_CATEGORIES.map((label) => (
                <span key={label} className="text-xs text-primary-foreground/55 transition-colors hover:text-champagne">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="what-we-catch" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow className="mb-4">The work itself</Eyebrow>
            <h2 className="font-display text-3xl font-medium leading-[1.08] tracking-[-0.025em] text-ink-900 sm:text-[2.6rem]">
              The clauses that
              <br />
              <span className="italic text-primary">cost the most.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              Not a highlighter. Each risky clause is read in context, scored, and
              explained in the language you'd use with a client.
            </p>
            <Link
              to="/register"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Start a review
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {CLAUSES.map((clause, index) => (
              <ClauseCard key={clause.category} clause={clause} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#13211f] text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <Eyebrow className="mb-4">A quieter workflow</Eyebrow>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-xl font-display text-3xl font-medium leading-[1.08] tracking-[-0.025em] text-primary-foreground sm:text-[2.6rem]">
              Built to be read,
              <br />
              <span className="italic text-primary">not just processed.</span>
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/55">
              Four considered tools, one consistent workspace. No dashboard theatre.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, number, title, body }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-[#13211f] p-6 transition-colors duration-300 hover:bg-[#1a2d29]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="font-mono text-[0.6rem] tracking-[0.16em] text-primary-foreground/25">
                    {number}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg text-primary-foreground">{title}</h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-primary-foreground/55">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Eyebrow className="mb-4">How it works</Eyebrow>
            <h2 className="font-display text-3xl font-medium leading-[1.08] tracking-[-0.025em] text-ink-900 sm:text-[2.6rem]">
              Three steps.
              <br />
              <span className="italic text-primary">No new habits.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              The parts that matter are handled. You get a clear read, a page
              reference, and a document you can act on.
            </p>
          </div>

          <div className="grid gap-0 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative border-t border-ink-200 pt-5 sm:px-5 sm:first:pl-0 sm:last:pr-0"
              >
                <span className="font-display text-4xl font-light leading-none text-brass/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-champagne/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full border border-champagne/10"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-4 flex items-center gap-2.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-primary-foreground/65">
                <span className="h-px w-6 bg-champagne/50" />
                Ready when the next one lands
              </p>
              <h2 className="max-w-lg font-display text-3xl font-medium leading-[1.06] tracking-[-0.025em] sm:text-[2.75rem]">
                Stop reading contracts twice.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/70">
                Upload one and see what it finds. No card required to try it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group bg-primary-foreground text-primary hover:bg-primary-foreground/90",
                )}
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/65 transition-colors hover:text-primary-foreground"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <Wordmark subtitle={false} />
            <span className="hidden font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink-400 sm:inline">
              © 2025
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-ink-400">
            <a href="#what-we-catch" className="transition-colors hover:text-ink-900">
              What we catch
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-ink-900">
              How it works
            </a>
            <Link to="/login" className="transition-colors hover:text-ink-900">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
