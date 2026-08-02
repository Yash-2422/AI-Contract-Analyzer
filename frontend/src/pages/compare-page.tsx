import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useContracts } from "@/hooks/use-contracts";
import { useCompareContracts } from "@/hooks/use-comparison";
import { getErrorMessage } from "@/lib/errors";

export function ComparePage() {
  const { data } = useContracts("", 1);
  const [contractAId, setContractAId] = useState("");
  const [contractBId, setContractBId] = useState("");
  const compareMutation = useCompareContracts();

  const processedContracts = data?.items.filter((c) => c.status === "processed") ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="font-display text-3xl font-medium text-ink-900">Compare contracts</h1>
        <p className="mt-1 text-ink-400">
          See what changed between two contracts — added, removed, and modified clauses.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink-600">Contract A</label>
            <select
              value={contractAId}
              onChange={(e) => setContractAId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm"
            >
              <option value="">Select a contract...</option>
              {processedContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-600">Contract B</label>
            <select
              value={contractBId}
              onChange={(e) => setContractBId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm"
            >
              <option value="">Select a contract...</option>
              {processedContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {processedContracts.length < 2 && (
          <p className="mt-3 text-sm text-ink-400">
            You need at least two processed contracts to compare.
          </p>
        )}

        <Button
          className="mt-4"
          disabled={!contractAId || !contractBId || contractAId === contractBId || compareMutation.isPending}
          onClick={() => compareMutation.mutate({ contractAId, contractBId })}
        >
          {compareMutation.isPending ? "Comparing..." : "Compare"}
        </Button>

        {compareMutation.isError && (
          <p className="mt-3 text-sm text-risk-600">{getErrorMessage(compareMutation.error)}</p>
        )}

        {compareMutation.data && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                {compareMutation.data.result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}