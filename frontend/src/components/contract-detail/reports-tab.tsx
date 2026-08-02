import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDownloadReport } from "@/hooks/use-reports";

const REPORT_TYPES = [
  { path: "summary", label: "Summary report" },
  { path: "risk", label: "Risk report" },
  { path: "clauses", label: "Clause report" },
];

export function ReportsTab({ contractId, displayName }: { contractId: string; displayName: string }) {
  const downloadReport = useDownloadReport();

  return (
    <div>
      <h3 className="font-display text-lg text-ink-900">Reports</h3>
      <p className="mt-2 text-sm text-ink-400">
        Download a PDF report. Generate a summary or risk analysis first for the best results.
      </p>

      <div className="mt-4 space-y-2">
        {REPORT_TYPES.map(({ path, label }) => (
          <div key={path} className="flex items-center justify-between rounded-md border border-ink-100 px-4 py-3">
            <span className="text-sm font-medium text-ink-900">{label}</span>
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
          </div>
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