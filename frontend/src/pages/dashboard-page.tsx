import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  FileText,
  GitCompare,
  HardDrive,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/store/auth-store";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardResponse, RiskDistribution } from "@/types/api";

const RISK_META: Record<
  keyof RiskDistribution,
  { label: string; bar: string; dot: string; text: string }
> = {
  low: {
    label: "Low",
    bar: "bg-emerald-600/60",
    dot: "bg-emerald-600/60",
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

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  format,
  tone = "paper",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  format?: (value: number) => string;
  tone?: "paper" | "forest" | "copper";
}) {
  const forest = tone === "forest";
  const copper = tone === "copper";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-6",
        forest && "border-primary/15 bg-primary text-primary-foreground",
        copper && "border-accent/20 bg-accent text-white",
      )}
    >
      {(forest || copper) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/15"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border",
            forest || copper
              ? "border-white/15 bg-white/10 text-champagne"
              : "border-ink-100 bg-ink-50 text-primary",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <ArrowUpRight
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            forest || copper ? "text-white/40" : "text-ink-200",
          )}
        />
      </div>
      <p
        className={cn(
          "mt-6 font-display text-[2.15rem] font-medium leading-none tracking-[-0.03em]",
          forest || copper ? "text-white" : "text-ink-900",
        )}
      >
        <AnimatedNumber value={value} format={format} />
      </p>
      <p
        className={cn(
          "mt-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em]",
          forest || copper ? "text-white/75" : "text-ink-400",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[0.6875rem] leading-snug",
          forest || copper ? "text-white/60" : "text-ink-400",
        )}
      >
        {note}
      </p>
    </Card>
  );
}

function RiskOverview({ distribution }: { distribution: RiskDistribution }) {
  const [animated, setAnimated] = useState(false);
  const keys = Object.keys(distribution) as (keyof RiskDistribution)[];
  const total = keys.reduce((sum, key) => sum + distribution[key], 0);
  const highRisk = distribution.high + distribution.critical;
  const highest = keys.reduce((current, key) =>
    distribution[key] > distribution[current] ? key : current,
  );

  useEffect(() => {
    setAnimated(false);
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [distribution]);

  return (
    <Card className="overflow-hidden rounded-2xl border-white/10 bg-[#13211f] text-primary-foreground shadow-lift">
      <CardHeader className="border-b border-white/10 pb-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-champagne/75">
              Portfolio signal
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium">Risk overview</h2>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/50">
              Findings across every analyzed contract in your workspace.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-[2.1rem] leading-none text-champagne">
              <AnimatedNumber value={total} />
            </p>
            <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-white/40">
              total findings
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {total === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-7 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-champagne/75" />
            <p className="mt-2 text-sm text-white/80">No risk findings yet.</p>
            <p className="mt-1 text-xs text-white/45">
              Analyze a contract to build your risk profile.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={keys
                .map((key) => `${RISK_META[key].label}: ${distribution[key]}`)
                .join(", ")}
            >
              {keys.map((key) => {
                const percentage = (distribution[key] / total) * 100;
                if (percentage === 0) return null;
                return (
                  <span
                    key={key}
                    className={cn(
                      RISK_META[key].bar,
                      "h-full transition-[width] duration-700 ease-editorial motion-reduce:transition-none",
                    )}
                    style={{ width: animated ? `${percentage}%` : "0%" }}
                    title={`${RISK_META[key].label}: ${distribution[key]}`}
                  />
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              {keys.map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-white/55">
                    <span className={cn("h-1.5 w-1.5 rounded-full", RISK_META[key].dot)} />
                    {RISK_META[key].label}
                  </span>
                  <span className="font-mono text-[0.68rem] font-medium text-white/85">
                    {distribution[key]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" />
              <p className="text-xs leading-relaxed text-white/55">
                {highRisk > 0 ? (
                  <>
                    <span className="font-medium text-champagne">{highRisk} high-risk finding{highRisk === 1 ? "" : "s"}</span>{" "}
                    combine high and critical severity and deserve a closer read.
                  </>
                ) : (
                  <>
                    Your largest concentration is{" "}
                    <span className="font-medium text-champagne">
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

function ActivityPanel({
  summaries,
  comparisons,
  messages,
  reports,
}: {
  summaries: number;
  comparisons: number;
  messages: number;
  reports: number;
}) {
  const rows = [
    ["Summaries generated", summaries],
    ["Comparisons run", comparisons],
    ["Chat messages sent", messages],
    ["Reports generated", reports],
  ] as const;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="rule-label">Workspace activity</p>
            <h2 className="mt-2 font-display text-2xl text-ink-900">Your reading room</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-400">
              Aggregate activity across your private workspace.
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 bg-ink-50 text-primary">
            <Activity className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between gap-4 py-3",
              index < rows.length - 1 && "border-b border-ink-100",
            )}
          >
            <span className="text-[0.8125rem] text-ink-400">{label}</span>
            <span className="font-mono text-[0.75rem] font-medium text-ink-900">
              <AnimatedNumber value={value} />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      to: "/contracts#upload",
      icon: UploadCloud,
      title: "Upload a contract",
      description: "Start a new analysis",
      primary: true,
    },
    {
      to: "/compare",
      icon: GitCompare,
      title: "Compare drafts",
      description: "Find what changed",
      primary: false,
    },
    {
      to: "/search",
      icon: Search,
      title: "Search workspace",
      description: "Find cited language",
      primary: false,
    },
  ] as const;

  return (
    <Card className="rounded-2xl border-primary/15 bg-primary text-primary-foreground">
      <CardHeader>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-champagne/75">
          Continue the work
        </p>
        <h2 className="mt-2 font-display text-2xl">Quick actions</h2>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {actions.map(({ to, icon: Icon, title, description, primary }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300 hover:-translate-y-px",
              primary
                ? "border-primary-foreground/15 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "border-white/10 bg-white/[0.045] text-primary-foreground hover:border-champagne/35 hover:bg-white/[0.08]",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                primary ? "bg-primary-soft text-primary" : "bg-white/10 text-champagne",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">{title}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[0.66rem]",
                  primary ? "text-primary/60" : "text-white/45",
                )}
              >
                {description}
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentContracts({ contracts }: { contracts: DashboardResponse["recent_contracts"] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <p className="rule-label">Recently opened</p>
          <h2 className="mt-2 font-display text-2xl text-ink-900">Recent contracts</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            The latest documents in your review queue.
          </p>
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
        {contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-paper/40 px-5 py-9 text-center">
            <FileText className="mx-auto h-5 w-5 text-ink-400" />
            <p className="mt-2 text-sm text-ink-600">Nothing on the desk yet.</p>
            <p className="mt-1 text-xs text-ink-400">Upload your first contract to begin.</p>
            <Link to="/contracts#upload" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
              Upload a contract
            </Link>
          </div>
        ) : (
          <ul className="-mx-2 divide-y divide-ink-100">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <Link
                  to={`/contracts/${contract.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-3.5 transition-all duration-300 hover:bg-ink-50/70 sm:gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-100 bg-paper/60 text-ink-400 transition-all duration-300 group-hover:border-primary/25 group-hover:bg-primary-soft group-hover:text-primary">
                    <FileText className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                      {contract.display_name}
                    </span>
                    <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-400">
                      Added {formatDate(contract.created_at)}
                    </span>
                  </span>
                  <ContractStatusBadge status={contract.status} />
                  <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardLoading() {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[11.5rem] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl lg:col-span-7" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-5" />
      </div>
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
            ? `Welcome back, ${firstName}. A focused view of the documents and findings that need your attention.`
            : "A focused view of the documents and findings that need your attention."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
              <Search className="h-3.5 w-3.5" />
              Search
            </Link>
            <Link to="/compare" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
              <GitCompare className="h-3.5 w-3.5" />
              Compare drafts
            </Link>
            <Link to="/contracts#upload" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
              <UploadCloud className="h-3.5 w-3.5" />
              Upload contract
            </Link>
          </div>
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

      {isLoading && <DashboardLoading />}

      {data && (
        <div className="mt-8 space-y-5">
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StaggerItem>
              <MetricCard icon={FileText} label="Contracts" value={data.total_contracts} note="In your private workspace" tone="forest" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                icon={ShieldAlert}
                label="High-risk findings"
                value={data.risk_distribution.high + data.risk_distribution.critical}
                note="High and critical severity"
                tone="copper"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                icon={ShieldCheck}
                label="Total findings"
                value={Object.values(data.risk_distribution).reduce((sum, count) => sum + count, 0)}
                note="Across analyzed contracts"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                icon={HardDrive}
                label="Storage used"
                value={data.storage_used_bytes}
                format={formatBytes}
                note="Secure document storage"
              />
            </StaggerItem>
          </Stagger>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RecentContracts contracts={data.recent_contracts} />
            </div>
            <div className="lg:col-span-5">
              <QuickActions />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RiskOverview distribution={data.risk_distribution} />
            </div>
            <div className="lg:col-span-5">
              <ActivityPanel
                summaries={data.summaries_generated_count}
                comparisons={data.comparisons_count}
                messages={data.chat_messages_count}
                reports={data.reports_generated_count}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-ink-100 pt-5 text-[0.6875rem] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-brass" /> All activity is scoped to your private workspace.</span>
            <span className="font-mono uppercase tracking-[0.1em]">Updated {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
