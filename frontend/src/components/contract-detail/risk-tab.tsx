import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/risk/severity-badge";
import { categoryLabel } from "@/lib/clause-labels";
import { useRiskAnalysis, useRunRiskAnalysis } from "@/hooks/use-risk";
import { getErrorMessage } from "@/lib/errors";

function ScoreDial({ score }: { score: number }) {
  const color = score >= 70 ? "text-risk-600" : score >= 40 ? "text-gold" : "text-emerald-600";
  return (
    <div className="flex flex-col items-center">
      <p className={`font-display text-4xl ${color}`}>{score}</p>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Risk score /100</p>
    </div>
  );
}

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

      {findings.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <ScoreDial score={score} />

          <div className="space-y-3">
            {findings.map((finding) => (
              <Card key={finding.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{finding.title}</p>
                      <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-ink-400">
                        {categoryLabel(finding.category)}
                        {finding.page_number != null && ` · Page ${finding.page_number}`}
                      </p>
                    </div>
                    <SeverityBadge severity={finding.severity} />
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{finding.explanation}</p>
                  <p className="mt-2 text-sm text-emerald-700">
                    <span className="font-medium">Suggestion: </span>
                    {finding.suggestion}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}