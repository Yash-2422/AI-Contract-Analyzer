import { useState } from "react";
import axios from "axios";
import { Check, Copy, FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Markdown } from "@/components/ui/markdown";
import { SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useGenerateSummary, useSummary } from "@/hooks/use-summary";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";

export function SummaryTab({ contractId }: { contractId: string }) {
  const { data: summary, isLoading, error, refetch } = useSummary(contractId);
  const generateMutation = useGenerateSummary(contractId);
  const [copied, setCopied] = useState(false);

  const notFound = axios.isAxiosError(error) && error.response?.status === 404;
  const current = summary ?? generateMutation.data;
  const isGenerating = generateMutation.isPending;

  async function copySummary() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access is a convenience; ignore denial.
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 p-5 sm:p-6">
        <div>
          <p className="rule-label">Plain-English overview</p>
          <h2 className="mt-2 font-display text-2xl text-ink-900">Summary</h2>
          <p className="mt-1 text-xs text-ink-400">
            Parties, obligations, payment terms, and duration — in one read.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <Button
              size="sm"
              variant="ghost"
              onClick={copySummary}
              aria-label="Copy summary"
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-primary" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant={current ? "outline" : "default"}
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
            className="gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : current ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate summary
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {isLoading && (
          <div className="max-w-[70ch] space-y-4">
            <SkeletonText lines={4} />
            <SkeletonText lines={3} />
            <SkeletonText lines={2} />
          </div>
        )}

        {generateMutation.isError && (
          <Alert tone="error" className="mb-4">
            {getErrorMessage(generateMutation.error, "We couldn't generate a summary.")}
          </Alert>
        )}

        {notFound && !current && !isGenerating && (
          <EmptyState
            icon={FileText}
            title="No summary yet."
            description="Generate a considered, plain-English overview of this contract. You can regenerate it at any time."
            action={
              <Button size="sm" onClick={() => generateMutation.mutate()} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Generate summary
              </Button>
            }
          />
        )}

        {!notFound && error && !current && (
          <Alert
            tone="error"
            action={
              <Button size="xs" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          >
            We couldn't load the summary for this contract.
          </Alert>
        )}

        {current && (
          <div>
            <div className="max-w-[70ch]">
              <Markdown content={current.content} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Grounded in this document
              </span>
              <span>Generated {formatDate(current.created_at)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
