import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SeverityBadge } from "@/components/risk/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { categoryLabel } from "@/lib/clause-labels";
import { useRiskAnalysis, useRunRiskAnalysis } from "@/hooks/use-risk";
import { getErrorMessage } from "@/lib/errors";
import type { RiskFinding, RiskSeverity } from "@/types/api";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  RiskSeverity,
  { border: string; wash: string; text: string; dot: string }
> = {
  low: {
    border: "border-l-emerald-600/45",
    wash: "bg-emerald-50/40",
    text: "text-emerald-700",
    dot: "bg-emerald-600",
  },
  medium: {
    border: "border-l-gold/60",
    wash: "bg-gold/[0.04]",
    text: "text-gold",
    dot: "bg-gold",
  },
  high: {
    border: "border-l-accent/70",
    wash: "bg-accent-soft/30",
    text: "text-accent-hover",
    dot: "bg-accent",
  },
  critical: {
    border: "border-l-risk-600",
    wash: "bg-risk-50/40",
    text: "text-risk-600",
    dot: "bg-risk-600",
  },
};

function scorePresentation(score: number) {
  if (score >= 70) {
    return {
      label: "Elevated risk",
      description: "Several clauses deserve a close read before signing.",
      className: "text-risk-600",
      stroke: "text-risk-600",
    };
  }
  if (score >= 40) {
    return {
      label: "Moderate risk",
      description: "There are a few terms worth negotiating or clarifying.",
      className: "text-gold",
      stroke: "text-gold",
    };
  }
  return {
    label: "Measured risk",
    description: "No severe concentration of risk was detected in this document.",
    className: "text-emerald-600",
    stroke: "text-emerald-600",
  };
}

function ScoreRing({ score }: { score: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const presentation = scorePresentation(score);

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="7"
          fill="none"
          className="text-ink-100"
          stroke="currentColor"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          className={presentation.stroke}
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-display text-4xl leading-none tracking-[-0.03em]", presentation.className)}>
          {Math.round(score)}
        </span>
        <span className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-400">
          / 100 risk
        </span>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: RiskFinding }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const meta = SEVERITY_META[finding.severity];

  async function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${finding.title}\n\n${finding.explanation}\n\nSuggestion: ${finding.suggestion}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can fail (permissions, insecure context).
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-ink-100 border-l-2 bg-surface transition-[border-color,box-shadow] duration-200 hover:shadow-card",
        meta.border,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className={cn("w-full px-4 py-4 text-left transition-colors hover:bg-ink-50/30", meta.wash)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-ink-900">{finding.title}</p>
            <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
              {categoryLabel(finding.category)}
              {finding.page_number != null && ` · Page ${finding.page_number}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-ink-400 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </div>

        <p
          className={cn(
            "mt-3 text-[0.8125rem] leading-relaxed text-ink-600",
            !expanded && "line-clamp-2",
          )}
        >
          {finding.explanation}
        </p>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-100 px-4 py-4">
              <div className="flex items-start gap-2.5 rounded-lg border border-primary/10 bg-primary-soft/40 px-3.5 py-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[0.8125rem] leading-relaxed text-ink-600">
                  <span className="font-medium text-ink-900">Suggested fix: </span>
                  {finding.suggestion}
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleCopy}
                  className="gap-1.5"
                  aria-label="Copy finding"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-primary" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy finding
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RiskTab({ contractId }: { contractId: string }) {
  const { data, isLoading, isError, refetch } = useRiskAnalysis(contractId);
  const runMutation = useRunRiskAnalysis(contractId);

  const findings = runMutation.data?.findings ?? data?.findings ?? [];
  const score = runMutation.data?.overall_risk_score ?? data?.overall_risk_score ?? 0;
  const presentation = scorePresentation(score);

  const counts = findings.reduce(
    (accumulator, finding) => {
      accumulator[finding.severity] += 1;
      return accumulator;
    },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<RiskSeverity, number>,
  );

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={score} />
            <div>
              <p className="rule-label">Overall risk</p>
              <h2 className={cn("mt-2 font-display text-2xl leading-tight", presentation.className)}>
                {findings.length === 0 ? "Not yet analysed" : presentation.label}
              </h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-400">
                {findings.length === 0
                  ? "Run an analysis to score the clauses in this contract."
                  : presentation.description}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="shrink-0 gap-1.5"
          >
            {runMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing…
              </>
            ) : findings.length > 0 ? (
              "Re-analyze"
            ) : (
              "Analyze risk"
            )}
          </Button>
        </div>

        {findings.length > 0 && (
          <div className="grid grid-cols-2 border-t border-ink-100 sm:grid-cols-4">
            {(Object.keys(SEVERITY_META) as RiskSeverity[]).map((severity, index) => (
              <div
                key={severity}
                className={cn(
                  "flex items-center justify-between gap-2 px-4 py-3",
                  index > 0 && "border-l border-ink-100",
                  index >= 2 && "border-t sm:border-t-0",
                )}
              >
                <span className="flex items-center gap-2 text-[0.6875rem] capitalize text-ink-400">
                  <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META[severity].dot)} />
                  {severity}
                </span>
                <span className="font-mono text-[0.7rem] font-medium text-ink-900">
                  {counts[severity]}
                </span>
              </div>
            ))}
          </div>
        )}

        {runMutation.isPending && (
          <div className="h-0.5 overflow-hidden bg-ink-100">
            <motion.div
              className="h-full w-1/3 bg-primary"
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      {runMutation.isError && (
        <Alert tone="error">
          {getErrorMessage(runMutation.error, "We couldn't analyze this contract.")}
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )}

      {isError && !isLoading && (
        <Alert
          tone="error"
          action={
            <Button size="xs" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        >
          We couldn't load the risk analysis for this contract.
        </Alert>
      )}

      {!isLoading && !isError && findings.length === 0 && !runMutation.isPending && (
        <EmptyState
          icon={ShieldCheck}
          title="No findings yet."
          description="Run a risk analysis to surface one-sided terms, unusual notice periods, and clauses worth negotiating."
          action={
            <Button size="sm" onClick={() => runMutation.mutate()} className="gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Analyze risk
            </Button>
          }
        />
      )}

      {findings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="rule-label">Findings · {findings.length}</p>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
              Tap a finding to read the suggestion
            </p>
          </div>
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
