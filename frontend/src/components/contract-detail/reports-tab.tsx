import { useState } from "react";
import { CheckCircle2, Download, FileText, List, Loader2, ShieldAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useDownloadReport } from "@/hooks/use-reports";

const REPORT_TYPES: {
  path: string;
  label: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    path: "summary",
    label: "Summary report",
    description: "A clean, plain-English overview of the agreement.",
    detail: "Parties, obligations, payment terms, duration",
    icon: FileText,
  },
  {
    path: "risk",
    label: "Risk report",
    description: "Every finding, severity, explanation, and suggested fix.",
    detail: "Clause categorization and risk score",
    icon: ShieldAlert,
  },
  {
    path: "clauses",
    label: "Clause report",
    description: "The full clause index, grouped by category.",
    detail: "A useful reference for negotiation",
    icon: List,
  },
];

function safeFilename(displayName: string, path: string) {
  const base = displayName
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "contract"}-${path}.pdf`;
}

export function ReportsTab({
  contractId,
  displayName,
}: {
  contractId: string;
  displayName: string;
}) {
  const downloadReport = useDownloadReport();
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

  function handleDownload(path: string) {
    setDownloadedPath(null);
    downloadReport.mutate(
      {
        path: `/contracts/${contractId}/reports/${path}`,
        filename: safeFilename(displayName, path),
      },
      {
        onSuccess: () => {
          setDownloadedPath(path);
          window.setTimeout(() => setDownloadedPath(null), 3200);
        },
      },
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-surface shadow-card">
      <div className="border-b border-ink-100 p-5 sm:p-6">
        <p className="rule-label">Export</p>
        <h2 className="mt-2 font-display text-2xl text-ink-900">Reports</h2>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-400">
          Download a PDF for whoever needs to sign off. Generate a summary or run a risk
          analysis first for the fullest report.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {REPORT_TYPES.map(({ path, label, description, detail, icon: Icon }) => {
          const isActive = downloadReport.isPending && downloadReport.variables?.path.includes(`/reports/${path}`);
          const downloaded = downloadedPath === path;

          return (
            <Card key={path} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="rounded border border-ink-100 bg-paper/60 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-400">
                    PDF
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base leading-snug text-ink-900">{label}</h3>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-400">{description}</p>
                <p className="mt-3 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400">
                  {detail}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={downloadReport.isPending}
                  onClick={() => handleDownload(path)}
                  aria-label={`Download ${label}`}
                  className="mt-4 w-full gap-1.5"
                >
                  {isActive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing…
                    </>
                  ) : downloaded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" /> Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {downloadReport.isError && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <Alert tone="error">
            We couldn't generate that report. Make sure the relevant analysis has been run
            first, then try again.
          </Alert>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-ink-100 bg-paper/40 px-5 py-3 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-400 sm:px-6">
        <FileText className="h-3 w-3" />
        Generated on the fly · Nothing stored on disk
      </div>
    </div>
  );
}
