import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatBytes, formatDate } from "@/lib/format";
import type { RiskDistribution } from "@/types/api";

const RISK_BAR_COLORS: Record<keyof RiskDistribution, string> = {
  low: "bg-ink-200",
  medium: "bg-gold",
  high: "bg-risk-600",
  critical: "bg-risk-600",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-400">{label}</p>
        <p className="mt-1 font-display text-3xl text-ink-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function RiskDistributionBar({ distribution }: { distribution: RiskDistribution }) {
  const total = distribution.low + distribution.medium + distribution.high + distribution.critical;

  if (total === 0) {
    return <p className="text-sm text-ink-400">No risk findings yet — analyze a contract to see its distribution here.</p>;
  }

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-ink-100">
        {(Object.keys(distribution) as (keyof RiskDistribution)[]).map((key) => {
          const pct = (distribution[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={RISK_BAR_COLORS[key]}
              style={{ width: `${pct}%` }}
              title={`${key}: ${distribution[key]}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {(Object.keys(distribution) as (keyof RiskDistribution)[]).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span className={`h-2 w-2 rounded-full ${RISK_BAR_COLORS[key]}`} />
            <span className="capitalize">{key}</span>
            <span className="text-ink-400">{distribution[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="font-display text-3xl font-medium text-ink-900">Dashboard</h1>
        <p className="mt-1 text-ink-400">An overview of your contracts and AI activity.</p>

        {isLoading && <p className="mt-8 text-sm text-ink-400">Loading...</p>}
        {isError && <p className="mt-8 text-sm text-risk-600">Couldn't load your dashboard.</p>}

        {data && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Contracts" value={data.total_contracts} />
              <StatCard label="Storage used" value={formatBytes(data.storage_used_bytes)} />
              <StatCard label="Chat sessions" value={data.chat_sessions_count} />
              <StatCard label="Reports generated" value={data.reports_generated_count} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskDistributionBar distribution={data.risk_distribution} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-ink-600">
                  <div className="flex justify-between">
                    <span>Summaries generated</span>
                    <span className="font-medium text-ink-900">{data.summaries_generated_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comparisons run</span>
                    <span className="font-medium text-ink-900">{data.comparisons_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chat messages sent</span>
                    <span className="font-medium text-ink-900">{data.chat_messages_count}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent contracts</CardTitle>
                <Link to="/contracts" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {data.recent_contracts.length === 0 ? (
                  <p className="text-sm text-ink-400">
                    No contracts yet.{" "}
                    <Link to="/contracts" className="font-medium text-emerald-600">
                      Upload your first one.
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {data.recent_contracts.map((contract) => (
                      <li key={contract.id}>
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="flex items-center justify-between py-3 hover:bg-ink-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-ink-900">{contract.display_name}</p>
                            <p className="text-xs text-ink-400">{formatDate(contract.created_at)}</p>
                          </div>
                          <ContractStatusBadge status={contract.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}