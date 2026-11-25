import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Copy,
  FileText,
  GitCompare,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/ui/markdown";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { Select } from "@/components/ui/select";
import { useContracts } from "@/hooks/use-contracts";
import { useCompareContracts } from "@/hooks/use-comparison";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function ContractPicker({
  label,
  marker,
  value,
  onChange,
  contracts,
  disabled,
}: {
  label: string;
  marker: "A" | "B";
  value: string;
  onChange: (value: string) => void;
  contracts: { id: string; display_name: string }[];
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-surface p-4 transition-colors",
        value ? "border-primary/25" : "border-ink-100",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-ink-900">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded font-mono text-[0.6rem] font-medium",
              marker === "A"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-white",
            )}
          >
            {marker}
          </span>
          {label}
        </span>
        {value && (
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-primary">
            Selected
          </span>
        )}
      </div>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={`Contract ${marker}`}
        className="mt-3"
      >
        <option value="">Select a contract…</option>
        {contracts.map((contract) => (
          <option key={contract.id} value={contract.id}>
            {contract.display_name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function ComparePage() {
  const { data } = useContracts("", 1);
  const [contractAId, setContractAId] = useState("");
  const [contractBId, setContractBId] = useState("");
  const [copied, setCopied] = useState(false);
  const compareMutation = useCompareContracts();
  const reduceMotion = useReducedMotion();

  const processedContracts = data?.items.filter((contract) => contract.status === "processed") ?? [];
  const selectedA = processedContracts.find((contract) => contract.id === contractAId);
  const selectedB = processedContracts.find((contract) => contract.id === contractBId);
  const sameContract = !!contractAId && contractAId === contractBId;
  const canCompare = !!contractAId && !!contractBId && !sameContract;

  function resetComparison() {
    compareMutation.reset();
    setCopied(false);
  }

  function handleSwap() {
    setContractAId(contractBId);
    setContractBId(contractAId);
    resetComparison();
  }

  async function copyResult() {
    if (!compareMutation.data) return;
    try {
      await navigator.clipboard.writeText(compareMutation.data.result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access is a convenience; ignore denial.
    }
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Side-by-side"
        title={
          <>
            Compare two
            <span className="italic text-primary"> drafts.</span>
          </>
        }
        description="See what changed between versions — added, removed, and quietly modified clauses, in a clear written report."
      />

      <Card className="mt-8 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <ContractPicker
            label="Original"
            marker="A"
            value={contractAId}
            onChange={(value) => {
              setContractAId(value);
              resetComparison();
            }}
            contracts={processedContracts}
            disabled={compareMutation.isPending}
          />

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!contractAId && !contractBId}
              aria-label="Swap contracts"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-400 transition-colors hover:border-primary/25 hover:text-primary disabled:opacity-30"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <ContractPicker
            label="Revised"
            marker="B"
            value={contractBId}
            onChange={(value) => {
              setContractBId(value);
              resetComparison();
            }}
            contracts={processedContracts}
            disabled={compareMutation.isPending}
          />
        </div>

        {sameContract && (
          <p className="mt-3 text-xs text-risk-600">
            Choose two different contracts to compare.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
          <p className="flex items-center gap-1.5 font-mono text-[0.56rem] uppercase tracking-[0.08em] text-ink-400">
            <GitCompare className="h-3 w-3" />
            Only processed contracts can be compared
          </p>
          <Button
            onClick={() => compareMutation.mutate({ contractAId, contractBId })}
            disabled={!canCompare || compareMutation.isPending}
            className="gap-2"
          >
            {compareMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing…
              </>
            ) : (
              <>
                Compare contracts
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {processedContracts.length < 2 && (
        <EmptyState
          className="mt-5"
          icon={FileText}
          title="Two processed contracts are needed."
          description="Upload and process another contract to see a clause-by-clause comparison."
          action={
            <Link to="/contracts#upload" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
              <UploadCloud className="h-3.5 w-3.5" />
              Add a contract
            </Link>
          }
        />
      )}

      {compareMutation.isError && (
        <Alert tone="error" className="mt-5">
          {getErrorMessage(compareMutation.error, "We couldn't compare those contracts.")}
        </Alert>
      )}

      {compareMutation.isPending && (
        <Card className="mt-5 overflow-hidden">
          <div className="flex items-center gap-3 p-5 sm:p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            </span>
            <div>
              <p className="font-display text-lg text-ink-900">Reading both documents.</p>
              <p className="mt-0.5 text-xs text-ink-400">
                Matching clauses and noting what shifted. This can take a moment.
              </p>
            </div>
          </div>
          <div className="h-0.5 overflow-hidden bg-ink-100">
            <motion.div
              className="h-full w-1/3 bg-accent"
              animate={reduceMotion ? undefined : { x: ["-100%", "350%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </Card>
      )}

      {compareMutation.data && !compareMutation.isPending && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-paper/35 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
                <GitCompare className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-400">
                  Comparison report
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-ink-900">
                  {selectedA?.display_name ?? "Contract A"}
                  <span className="mx-1.5 text-ink-400">→</span>
                  {selectedB?.display_name ?? "Contract B"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400 sm:inline">
                {formatDate(compareMutation.data.created_at)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={copyResult}
                className="gap-1.5"
                aria-label="Copy comparison report"
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
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mx-auto max-w-[76ch]">
              <Markdown content={compareMutation.data.result} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-ink-100 bg-paper/35 px-5 py-3 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400 sm:px-6">
            <FileText className="h-3 w-3" />
            AI-generated comparison — verify key terms before relying on it
          </div>
        </motion.div>
      )}
    </PageContainer>
  );
}
