import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryTab } from "@/components/contract-detail/summary-tab";
import { RiskTab } from "@/components/contract-detail/risk-tab";
import { ChatTab } from "@/components/contract-detail/chat-tab";
import { ReportsTab } from "@/components/contract-detail/reports-tab";
import { useContract, useDeleteContract, useProcessContract } from "@/hooks/use-contracts";
import { formatBytes, formatDate } from "@/lib/format";

export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(contractId);
  const processMutation = useProcessContract();
  const deleteMutation = useDeleteContract();

  if (!contractId) return null;

  async function handleDelete() {
    if (!confirm("Delete this contract? This can't be undone.")) return;
    await deleteMutation.mutateAsync(contractId!);
    navigate("/contracts");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <button
          onClick={() => navigate("/contracts")}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to contracts
        </button>

        {isLoading && <p className="mt-6 text-sm text-ink-400">Loading...</p>}

        {contract && (
          <>
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-medium text-ink-900">
                  {contract.display_name}
                </h1>
                <p className="mt-1 font-mono text-xs text-ink-400">
                  {formatBytes(contract.size_bytes)} &middot; Uploaded {formatDate(contract.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ContractStatusBadge status={contract.status} />
                <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 text-risk-600" />
                </Button>
              </div>
            </div>

            {contract.status === "uploaded" && (
              <div className="mt-6 rounded-md border border-dashed border-ink-200 p-4">
                <p className="text-sm text-ink-600">
                  This contract needs to be processed before you can generate a summary, run risk
                  analysis, or chat with it.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => processMutation.mutate(contractId)}
                  disabled={processMutation.isPending}
                >
                  {processMutation.isPending ? "Processing..." : "Process contract"}
                </Button>
              </div>
            )}

            {contract.status === "processing" && (
              <p className="mt-6 text-sm text-ink-400">Processing... this page will update automatically.</p>
            )}

            {contract.status === "failed" && (
              <p className="mt-6 text-sm text-risk-600">
                Processing failed. Check the backend logs, or try re-uploading the file.
              </p>
            )}

            {contract.status === "processed" && (
              <Tabs defaultValue="summary" className="mt-6">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="risk">Risk</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
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
          </>
        )}
      </div>
    </AppLayout>
  );
}