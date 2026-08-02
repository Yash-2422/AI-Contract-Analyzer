import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { UploadDropzone } from "@/components/contracts/upload-dropzone";
import { useContracts, useUploadContract } from "@/hooks/use-contracts";
import { formatBytes, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";

export function ContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContracts(search, page);
  const uploadMutation = useUploadContract();

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="font-display text-3xl font-medium text-ink-900">Contracts</h1>
        <p className="mt-1 text-ink-400">Upload, review, and manage your contracts.</p>

        <div className="mt-8">
          <UploadDropzone
            disabled={uploadMutation.isPending}
            onFileSelected={(file) => uploadMutation.mutate(file)}
          />
          {uploadMutation.isPending && (
            <p className="mt-2 text-sm text-ink-400">Uploading...</p>
          )}
          {uploadMutation.isError && (
            <p className="mt-2 text-sm text-risk-600">{getErrorMessage(uploadMutation.error)}</p>
          )}
        </div>

        <div className="mt-8">
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        <Card className="mt-4">
          <CardContent className="p-0">
            {isLoading && <p className="p-6 text-sm text-ink-400">Loading...</p>}

            {data && data.items.length === 0 && (
              <p className="p-6 text-sm text-ink-400">
                {search ? "No contracts match your search." : "No contracts uploaded yet."}
              </p>
            )}

            {data && data.items.length > 0 && (
              <ul className="divide-y divide-ink-100">
                {data.items.map((contract) => (
                  <li key={contract.id}>
                    <Link
                      to={`/contracts/${contract.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-ink-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-900">{contract.display_name}</p>
                        <p className="mt-0.5 font-mono text-xs text-ink-400">
                          {formatBytes(contract.size_bytes)} &middot; {formatDate(contract.created_at)}
                        </p>
                      </div>
                      <ContractStatusBadge status={contract.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {data && data.total > data.page_size && (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-400">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {data.page} of {Math.ceil(data.total / data.page_size)}
            </span>
            <button
              disabled={page * data.page_size >= data.total}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}