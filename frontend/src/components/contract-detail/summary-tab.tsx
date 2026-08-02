import { Button } from "@/components/ui/button";
import { useGenerateSummary, useSummary } from "@/hooks/use-summary";
import { getErrorMessage } from "@/lib/errors";
import axios from "axios";

export function SummaryTab({ contractId }: { contractId: string }) {
  const { data: summary, isLoading, error } = useSummary(contractId);
  const generateMutation = useGenerateSummary(contractId);

  const notFound = axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-ink-900">Summary</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending
            ? "Generating..."
            : summary
              ? "Regenerate"
              : "Generate summary"}
        </Button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-ink-400">Loading...</p>}

      {notFound && !summary && !generateMutation.data && (
        <p className="mt-4 text-sm text-ink-400">
          No summary yet. Generate one to get a plain-English overview of this contract.
        </p>
      )}

      {generateMutation.isError && (
        <p className="mt-4 text-sm text-risk-600">{getErrorMessage(generateMutation.error)}</p>
      )}

      {(summary ?? generateMutation.data) && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
          {(summary ?? generateMutation.data)?.content}
        </p>
      )}
    </div>
  );
}