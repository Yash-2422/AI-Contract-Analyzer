import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileDown,
  FileText,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageContainer } from "@/components/ui/page-shell";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryTab } from "@/components/contract-detail/summary-tab";
import { RiskTab } from "@/components/contract-detail/risk-tab";
import { ChatTab } from "@/components/contract-detail/chat-tab";
import { ReportsTab } from "@/components/contract-detail/reports-tab";
import { useContract, useDeleteContract, useProcessContract } from "@/hooks/use-contracts";
import { formatBytes, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

function ProcessContractCard({
  onProcess,
  pending,
  error,
}: {
  onProcess: () => void;
  pending: boolean;
  error: unknown;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div>
          <p className="rule-label">Next step</p>
          <h2 className="mt-2 font-display text-2xl text-ink-900">Turn the pages into a review.</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
            Processing extracts the text, maps the clauses, and prepares this document for
            summaries, risk analysis, and grounded conversation.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-400">
            <li className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-brass" /> Plain-language summary
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-accent" /> Clause risk review
            </li>
            <li className="flex items-center gap-1.5">
              <MessageSquareText className="h-3 w-3 text-primary" /> Page-cited chat
            </li>
          </ul>
          {Boolean(error) && (
            <Alert tone="error" className="mt-4">
              {getErrorMessage(error, "We couldn't process this contract. Please try again.")}
            </Alert>
          )}
        </div>
        <Button size="lg" onClick={onProcess} disabled={pending} className="w-full sm:w-auto">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Process contract"
          )}
        </Button>
      </div>
      <div className="border-t border-ink-100 bg-paper/40 px-6 py-3 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400 sm:px-8">
        PDF & DOCX · Text and OCR extraction · Private to your workspace
      </div>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="mt-6 rounded-xl border border-ink-100 bg-surface p-8 shadow-card">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </span>
        <div>
          <p className="rule-label">In progress</p>
          <h2 className="mt-2 font-display text-2xl text-ink-900">Reading the document.</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
            We're extracting text and building the clause index. This page will update
            automatically — you don't need to refresh.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-gold" />
              Extracting pages
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
              Indexing clauses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
              Preparing review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, isError, refetch } = useContract(contractId);
  const processMutation = useProcessContract();
  const deleteMutation = useDeleteContract();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!contractId) return null;

  async function handleDelete() {
    if (!contractId) return;
    try {
      await deleteMutation.mutateAsync(contractId);
      navigate("/contracts");
    } catch {
      // The dialog stays open; its error is rendered below.
    }
  }

  return (
    <PageContainer width="wide">
      <Link
        to="/contracts"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to contracts
      </Link>

      {isLoading && (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="mt-8">
          <Alert
            tone="error"
            action={
              <Button size="xs" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          >
            We couldn't open this contract. It may have been removed, or you may not have
            access to it.
          </Alert>
        </div>
      )}

      {contract && (
        <>
          <div className="mt-5 overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink-100 bg-paper/60 text-primary sm:flex">
                  <FileText className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rule-label">Contract</span>
                    <ContractStatusBadge status={contract.status} />
                  </div>
                  <h1 className="mt-2 break-words font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-ink-900 sm:text-3xl">
                    {contract.display_name}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink-400">
                    <span>{formatBytes(contract.size_bytes)}</span>
                    <span className="h-1 w-1 rounded-full bg-ink-200" />
                    <span>Uploaded {formatDate(contract.created_at)}</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Tooltip content="Delete contract">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleteMutation.isPending}
                    aria-label="Delete contract"
                    className="text-ink-400 hover:text-risk-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {contract.status === "uploaded" && (
            <ProcessContractCard
              onProcess={() => processMutation.mutate(contractId)}
              pending={processMutation.isPending}
              error={processMutation.error}
            />
          )}

          {contract.status === "processing" && <ProcessingState />}

          {contract.status === "failed" && (
            <div className="mt-6">
              <Alert
                tone="error"
                action={
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => processMutation.mutate(contractId)}
                    disabled={processMutation.isPending}
                  >
                    Try again
                  </Button>
                }
              >
                <span className="font-medium text-ink-900">Processing didn't finish.</span>{" "}
                The document may be image-only or malformed. Try processing again, or upload a
                fresh copy.
              </Alert>
            </div>
          )}

          {contract.status === "processed" && (
            <Tabs defaultValue="summary" className="mt-5">
              <TabsList aria-label="Contract analysis sections">
                <TabsTrigger
                  value="summary"
                  icon={<FileText className="h-3.5 w-3.5" strokeWidth={1.8} />}
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="risk"
                  icon={<ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />}
                >
                  Risk
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  icon={<MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.8} />}
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  icon={<FileDown className="h-3.5 w-3.5" strokeWidth={1.8} />}
                >
                  Reports
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <SummaryTab contractId={contractId} />
              </TabsContent>
              <TabsContent value="risk">
                <RiskTab contractId={contractId} />
              </TabsContent>
              <TabsContent value="chat">
                <ChatTab contractId={contractId} />
              </TabsContent>
              <TabsContent value="reports">
                <ReportsTab contractId={contractId} displayName={contract.display_name} />
              </TabsContent>
            </Tabs>
          )}

          {contract.status !== "processed" && contract.status !== "uploaded" && (
            <div className="mt-5">
              <Link
                to="/contracts"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                Back to library
              </Link>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this contract?"
        description="This removes the document, its summaries, risk findings, chat history, and generated reports. This can't be undone."
        confirmLabel="Delete contract"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      >
        {deleteMutation.isError && (
          <Alert tone="error" className="text-xs">
            {getErrorMessage(deleteMutation.error, "We couldn't delete this contract.")}
          </Alert>
        )}
        <div className="rounded-lg border border-ink-100 bg-paper/50 px-3.5 py-3">
          <p className="flex items-center gap-2 text-xs text-ink-600">
            <FileText className="h-3.5 w-3.5 text-ink-400" />
            <span className="truncate">{contract?.display_name}</span>
          </p>
        </div>
      </ConfirmDialog>

      {deleteMutation.isError && !deleteOpen && (
        <Alert tone="error" className="mt-4">
          {getErrorMessage(deleteMutation.error, "We couldn't delete this contract.")}
        </Alert>
      )}
    </PageContainer>
  );
}
