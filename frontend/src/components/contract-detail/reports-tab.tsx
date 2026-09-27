import { Download, FileText, List, ShieldAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDownloadReport } from "@/hooks/use-reports";

const REPORT_TYPES: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "summary", label: "Summary report", icon: FileText },
  { path: "risk", label: "Risk report", icon: ShieldAlert },
  { path: "clauses", label: "Clause report", icon: List },
];

export function ReportsTab({ contractId, displayName }: { contractId: string; displayName: string }) {
  const downloadReport = useDownloadReport();

  return (
    <div>
      <h3 className="font-display text-lg text-ink-900">Reports</h3>
      <p className="mt-2 text-sm text-ink-400">
        Download a PDF report. Generate a summary or risk analysis first for the best results.
      </p>

      <div className="mt-4 space-y-3">
        {REPORT_TYPES.map(({ path, label, icon: Icon }) => (
          <Card key={path}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-ink-900">{label}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={downloadReport.isPending}
                onClick={() =>
                  downloadReport.mutate({
                    path: `/contracts/${contractId}/reports/${path}`,
                    filename: `${displayName}-${path}.pdf`,
                  })
                }
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {downloadReport.isError && (
        <p className="mt-3 text-sm text-risk-600">
          Couldn't generate that report. Make sure you've run the relevant analysis first.
        </p>
      )}
    </div>
  );
}