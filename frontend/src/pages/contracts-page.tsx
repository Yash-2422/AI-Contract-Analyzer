import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  FilePlus2,
  FileText,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { Spinner } from "@/components/ui/spinner";
import { ContractStatusBadge } from "@/components/contracts/status-badge";
import { UploadDropzone } from "@/components/contracts/upload-dropzone";
import { useContracts, useUploadContract } from "@/hooks/use-contracts";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatBytes, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Contract } from "@/types/api";

export function ContractsPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploadState, setUploadState] = useState<{ file: File; progress: number } | null>(
    null,
  );
  const [uploadedContract, setUploadedContract] = useState<Contract | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 280);
  const { data, isLoading, isError, isFetching, refetch } = useContracts(
    debouncedSearch,
    page,
  );
  const uploadMutation = useUploadContract();

  useEffect(() => {
    if (location.hash !== "#upload") return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("upload")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  function handleFile(file: File) {
    setUploadedContract(null);
    setUploadError(null);
    setUploadState({ file, progress: 0 });
    uploadMutation.mutate(
      {
        file,
        onProgress: (progress) =>
          setUploadState((current) => (current ? { ...current, progress } : current)),
      },
      {
        onSuccess: (contract) => {
          setUploadState(null);
          setUploadedContract(contract);
          setPage(1);
        },
        onError: (error) => {
          setUploadState(null);
          setUploadError(getErrorMessage(error, "That upload didn't finish. Please try again."));
        },
      },
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Document library"
        title={
          <>
            Contracts, kept
            <span className="italic text-primary"> in order.</span>
          </>
        }
        description="Upload, review, and return to every agreement in one private reading room."
        actions={
          <a href="#upload" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
            <FilePlus2 className="h-3.5 w-3.5" />
            Upload contract
          </a>
        }
      />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <div id="upload" className="scroll-mt-28 lg:sticky lg:top-28">
          <Card>
            <CardHeader>
              <p className="rule-label">New document</p>
              <h2 className="mt-2 font-display text-xl text-ink-900">Add a contract</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                We'll read the pages, find the clauses, and keep the citations.
              </p>
            </CardHeader>
            <CardContent>
              <UploadDropzone
                disabled={uploadMutation.isPending}
                onFileSelected={handleFile}
                progress={uploadState?.progress ?? null}
                filename={uploadState?.file.name}
              />
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-400">
                <ShieldCheck className="h-3 w-3" />
                Private to your workspace
              </p>
            </CardContent>
          </Card>

          {uploadedContract && (
            <Alert
              tone="success"
              className="mt-3"
              action={
                <Link
                  to={`/contracts/${uploadedContract.id}`}
                  className="shrink-0 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open
                </Link>
              }
            >
              <span className="font-medium text-ink-900">{uploadedContract.display_name}</span>{" "}
              is in your library. Open it to process the document.
            </Alert>
          )}

          {uploadError && (
            <Alert tone="error" className="mt-3">
              {uploadError}
            </Alert>
          )}
        </div>

        <Card className="min-w-0">
          <CardHeader className="gap-4 border-b border-ink-100 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="rule-label">Library</p>
                <h2 className="mt-2 font-display text-xl text-ink-900">All contracts</h2>
              </div>
              <div className="flex items-center gap-2">
                {isFetching && !isLoading && <Spinner size="sm" />}
                {data && (
                  <span className="rounded-md border border-ink-100 bg-paper/60 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-400">
                    {data.total} {data.total === 1 ? "document" : "documents"}
                  </span>
                )}
              </div>
            </div>

            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by contract name…"
                aria-label="Search contracts"
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading && (
              <div className="divide-y divide-ink-100">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="p-5 sm:p-6">
                <Alert
                  tone="error"
                  action={
                    <Button size="xs" variant="outline" onClick={() => refetch()}>
                      Try again
                    </Button>
                  }
                >
                  We couldn't load your contracts. Check your connection and try again.
                </Alert>
              </div>
            )}

            {data && !isLoading && data.items.length === 0 && (
              <div className="p-5 sm:p-6">
                <EmptyState
                  icon={FileText}
                  title={debouncedSearch ? "No contracts match that search." : "Nothing here yet."}
                  description={
                    debouncedSearch
                      ? "Try a shorter name, or clear the search to see the whole library."
                      : "Upload a PDF or DOCX to start your first review."
                  }
                  action={
                    debouncedSearch ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSearch("");
                          setPage(1);
                        }}
                      >
                        Clear search
                      </Button>
                    ) : (
                      <a href="#upload" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
                        <UploadCloud className="h-3.5 w-3.5" />
                        Upload a contract
                      </a>
                    )
                  }
                />
              </div>
            )}

            {data && data.items.length > 0 && (
              <ul className="divide-y divide-ink-100">
                {data.items.map((contract) => (
                  <li key={contract.id}>
                    <Link
                      to={`/contracts/${contract.id}`}
                      className="group flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-ink-50/60 sm:gap-4 sm:px-6"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-paper/60 text-ink-400 transition-colors group-hover:border-primary/20 group-hover:text-primary">
                        <FileText className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.8125rem] font-medium text-ink-900">
                          {contract.display_name}
                        </p>
                        <p className="mt-1 truncate font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink-400">
                          {formatBytes(contract.size_bytes)} · {formatDate(contract.created_at)}
                        </p>
                      </div>
                      <ContractStatusBadge status={contract.status} />
                      <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          {data && data.total > data.page_size && (
            <div className="flex items-center justify-between border-t border-ink-100 px-5 py-4 sm:px-6">
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-400">
                Page {data.page} of {totalPages}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
