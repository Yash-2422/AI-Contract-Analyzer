import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  FileDown,
  FileText,
  HardDrive,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/store/auth-store";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RiskDistribution } from "@/types/api";

const RISK_META: Record<
  keyof RiskDistribution,
  { label: string; bar: string; dot: string; text: string }
> = {
  low: {
    label: "Low",
    bar: "bg-emerald-600/55",
    dot: "bg-emerald-600/55",
    text: "text-emerald-700",
  },
  medium: { label: "Medium", bar: "bg-gold", dot: "bg-gold", text: "text-gold" },
  high: { label: "High", bar: "bg-accent", dot: "bg-accent", text: "text-accent-hover" },
  critical: {
    label: "Critical",
    bar: "bg-risk-600",
    dot: "bg-risk-600",
    text: "text-risk-600",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  format,
  feature = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  format?: (value: number) => string;
  feature?: boolean;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        feature && "border-primary/15 bg-primary text-primary-foreground",
      )}
    >
      {feature && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-champagne/15"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            feature
              ? "border-white/10 bg-white/10 text-champagne"
              : "border-ink-100 bg-ink-50 text-primary",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        {!feature && (
          <ArrowUpRight className="h-3.5 w-3.5 text-ink-200 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        )}
      </div>
      <p
        className={cn(
          "mt-5 font-display text-[2.1rem] font-medium leading-none tracking-[-0.03em]",
          feature ? "text-primary-foreground" : "text-ink-900",
        )}
      >
        <AnimatedNumber value={value} format={format} />
      </p>
      <p
        className={cn(
          "mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
          feature ? "text-primary-foreground/70" : "text-ink-400",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[0.6875rem] leading-snug",
          feature ? "text-primary-foreground/65" : "text-ink-400",
        )}
      >
        {note}
      </p>
    </Card>
  );
}

function RiskDistributionBlock({ distribution }: { distribution: RiskDistribution }) {
  const [animated, setAnimated] = useState(false);
  const keys = Object.keys(distribution) as (keyof RiskDistribution)[];
  const total = keys.reduce((sum, key) => sum + distribution[key], 0);

  useEffect(() => {
    setAnimated(false);
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [distribution]);

  const highest = keys.reduce((current, key) =>
    distribution[key] > distribution[current] ? key : current,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="rule-label">Portfolio signal</p>
          <h2 className="mt-2 font-display text-xl text-ink-900">Risk profile</h2>
          <p className="mt-1 text-xs text-ink-400">
            Across every finding in your workspace.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[2rem] leading-none text-ink-900">
            <AnimatedNumber value={total} />
          </p>
          <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
            findings
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-200 bg-paper/40 px-4 py-6 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-ink-400" />
            <p className="mt-2 text-sm text-ink-600">No risk findings yet.</p>
            <p className="mt-1 text-xs text-ink-400">
              Analyze a contract to build your risk profile.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-ink-50"
              role="img"
              aria-label={keys
                .map((key) => `${RISK_META[key].label}: ${distribution[key]}`)
                .join(", ")}
            >
              {keys.map((key) => {
                const pct = (distribution[key] / total) * 100;
                if (pct === 0) return null;
                return (
                  <span
                    key={key}
                    className={cn(
                      RISK_META[key].bar,
                      "h-full transition-[width] duration-700 ease-editorial motion-reduce:transition-none",
                    )}
                    style={{ width: animated ? `${pct}%` : "0%" }}
                    title={`${RISK_META[key].label}: ${distribution[key]}`}
                  />
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {keys.map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-ink-400">
                    <span className={cn("h-1.5 w-1.5 rounded-full", RISK_META[key].dot)} />
                    {RISK_META[key].label}
                  </span>
                  <span className="font-mono text-[0.68rem] font-medium text-ink-600">
                    {distribution[key]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-ink-100 bg-paper/50 px-3.5 py-3">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" />
              <p className="text-xs leading-relaxed text-ink-400">
                {distribution.critical > 0 ? (
                  <>
                    <span className="font-medium text-risk-600">
                      {distribution.critical} critical finding
                      {distribution.critical === 1 ? "" : "s"}
                    </span>{" "}
                    deserve a closer read before signing.
                  </>
                ) : (
                  <>
                    Your largest concentration is{" "}
                    <span className={cn("font-medium", RISK_META[highest].text)}>
                      {RISK_META[highest].label.toLowerCase()} severity
                    </span>
                    . Keep an eye on changes between drafts.
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        !last && "border-b border-ink-100",
      )}
    >
      <span className="text-[0.8125rem] text-ink-400">{label}</span>
      <span className="font-mono text-[0.75rem] font-medium text-ink-900">
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(/\s+/)[0];

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Workspace overview"
        title={
          <>
            Your contract
            <span className="italic text-primary"> desk.</span>
          </>
        }
        description={
          firstName
            ? `Welcome back, ${firstName}. A considered view of everything you have read, reviewed, and need to sign.`
            : "A considered view of everything you have read, reviewed, and need to sign."
        }
        actions={
          <>
            <Link
              to="/compare"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Compare drafts
            </Link>
            <Link
              to="/contracts#upload"
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload contract
            </Link>
          </>
        }
      />

      {isError && (
        <Alert
          tone="error"
          className="mt-8"
          action={
            <Button size="xs" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        >
          We couldn't load your dashboard. Check your connection and try again.
        </Alert>
      )}

      {isLoading && (
        <div className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[10.75rem] rounded-xl" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-12">
            <Skeleton className="h-72 rounded-xl lg:col-span-7" />
            <Skeleton className="h-72 rounded-xl lg:col-span-5" />
          </div>
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-5">
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StaggerItem>
              <StatCard
                icon={FileText}
                label="Contracts"
                value={data.total_contracts}
                note="In your workspace"
                feature
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={HardDrive}
                label="Storage used"
                value={data.storage_used_bytes}
                format={formatBytes}
                note="Secure document storage"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={MessageSquareText}
                label="Conversations"
                value={data.chat_sessions_count}
                note={`${data.chat_messages_count.toLocaleString()} messages sent`}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon={FileDown}
                label="Reports"
                value={data.reports_generated_count}
                note="PDFs generated on demand"
              />
            </StaggerItem>
          </Stagger>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RiskDistributionBlock distribution={data.risk_distribution} />
            </div>

            <Card className="lg:col-span-5">
              <CardHeader>
                <p className="rule-label">Reading room activity</p>
                <h2 className="mt-2 font-display text-xl text-ink-900">AI activity</h2>
                <p className="mt-1 text-xs text-ink-400">
                  What the workspace has helped you do.
                </p>
              </CardHeader>
              <CardContent>
                <ActivityRow label="Summaries generated" value={data.summaries_generated_count} />
                <ActivityRow label="Comparisons run" value={data.comparisons_count} />
                <ActivityRow label="Chat messages sent" value={data.chat_messages_count} last />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <p className="rule-label">Recently opened</p>
                  <h2 className="mt-2 font-display text-xl text-ink-900">
                    Recent contracts
                  </h2>
                </div>
                <Link
                  to="/contracts"
                  className="group flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  View all
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.recent_contracts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-ink-200 bg-paper/40 px-5 py-8 text-center">
                    <FileText className="mx-auto h-5 w-5 text-ink-400" />
                    <p className="mt-2 text-sm text-ink-600">Nothing on the desk yet.</p>
                    <p className="mt-1 text-xs text-ink-400">
                      Upload your first contract to begin.
                    </p>
                    <Link
                      to="/contracts#upload"
                      className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                    >
                      Upload a contract
                    </Link>
                  </div>
                ) : (
                  <ul className="-mx-2 divide-y divide-ink-100">
                    {data.recent_contracts.map((contract) => (
                      <li key={contract.id}>
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="group -mx-1 flex items-center gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-ink-50/60"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-paper/60 text-ink-400 transition-colors group-hover:border-primary/20 group-hover:text-primary">
                            <FileText className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.8125rem] font-medium text-ink-900">
                              {contract.display_name}
                            </p>
                            <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink-400">
                              {formatDate(contract.created_at)}
                            </p>
                          </div>
                          <ContractStatusBadge status={contract.status} />
                          <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 sm:block" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-4">
              <Card className="relative h-full overflow-hidden border-primary/15 bg-primary text-primary-foreground">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full border border-champagne/10"
                />
                <CardContent className="flex h-full flex-col p-6">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-primary-foreground/65">
                    Start here
                  </p>
                  <h2 className="mt-3 max-w-[13rem] font-display text-2xl font-medium leading-tight">
                    One document is enough.
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-primary-foreground/65">
                    Bring a PDF or DOCX. The first cautious read is on us.
                  </p>
                  <div className="mt-auto pt-8">
                    <Link
                      to="/contracts#upload"
                      className="group inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-3.5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Analyze a contract
                      <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-ink-100 pt-5 text-[0.6875rem] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <span>All activity is scoped to your private workspace.</span>
            <span className="font-mono uppercase tracking-[0.1em]">
              {formatDate(new Date().toISOString())}
            </span>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
