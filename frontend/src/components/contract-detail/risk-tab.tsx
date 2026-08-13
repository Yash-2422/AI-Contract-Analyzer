import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/risk/severity-badge";
import { categoryLabel } from "@/lib/clause-labels";
import { useRiskAnalysis, useRunRiskAnalysis } from "@/hooks/use-risk";
import { getErrorMessage } from "@/lib/errors";
import type { RiskFinding } from "@/types/api";
import * as React from "react";

// ─── Score ring ─────────────────────────────────────────────────────
// Same idea as a dial, but the arc length communicates the score
// magnitude at a glance, and animates in on first paint instead of
// appearing fully-drawn (respects prefers-reduced-motion globally via
// index.css's reduced-motion block).
function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Higher score = riskier, so the color scale runs emerald -> gold -> risk.
  const colorClass = score >= 70 ? "text-risk-600" : score >= 40 ? "text-gold" : "text-emerald-600";
  const trackClass = "text-ink-100";

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} strokeWidth="7" fill="none" className={trackClass} stroke="currentColor" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          className={`${colorClass} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-2xl leading-none ${colorClass}`}>{score}</span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-wide text-ink-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── Finding card ───────────────────────────────────────────────────
function FindingCard({ finding }: { finding: RiskFinding }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${finding.title}\n\n${finding.explanation}\n\nSuggestion: ${finding.suggestion}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) - silently
      // no-op rather than surfacing an error for a non-critical convenience action.
    }
  }

  return (
    <Card>
      <CardContent
        className="cursor-pointer p-4"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{finding.title}</p>
            <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-ink-400">
              {categoryLabel(finding.category)}
              {finding.page_number != null && ` · Page ${finding.page_number}`}
            </p>
          </div>
          <SeverityBadge severity={finding.severity} />
        </div>

        <p className={`mt-2 text-sm text-ink-600 ${expanded ? "" : "line-clamp-2"}`}>{finding.explanation}</p>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
            <p className="text-sm text-emerald-700">
              <span className="font-medium">Suggestion: </span>
              {finding.suggestion}
            </p>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? "Copied" : "Copy finding"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Risk tab ───────────────────────────────────────────────────────
export function RiskTab({ contractId }: { contractId: string }) {
  const { data, isLoading } = useRiskAnalysis(contractId);
  const runMutation = useRunRiskAnalysis(contractId);

  const findings = runMutation.data?.findings ?? data?.findings ?? [];
  const score = runMutation.data?.overall_risk_score ?? data?.overall_risk_score ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-ink-900">Risk analysis</h3>
        <Button size="sm" variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
          {runMutation.isPending ? "Analyzing..." : findings.length > 0 ? "Re-analyze" : "Analyze risk"}
        </Button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-ink-400">Loading...</p>}

      {runMutation.isError && (
        <p className="mt-4 text-sm text-risk-600">{getErrorMessage(runMutation.error)}</p>
      )}

      {findings.length === 0 && !isLoading && !runMutation.isPending && (
        <p className="mt-4 text-sm text-ink-400">
          No risk analysis yet. Run one to detect risky or one-sided clauses.
        </p>
      )}

      {runMutation.isPending && (
        <div className="mt-6 flex items-center gap-3 text-sm text-ink-400">
          <svg className="h-4 w-4 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Reading clauses and scoring risk...
        </div>
      )}

      {findings.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score} />
            <p className="text-center font-mono text-[10px] uppercase tracking-wide text-ink-400">
              Overall risk
            </p>
          </div>

          <div className="space-y-3">
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}