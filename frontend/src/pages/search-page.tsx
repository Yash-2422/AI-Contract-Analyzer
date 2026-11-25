import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CornerDownLeft, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

const EXAMPLE_QUERIES = [
  "termination notice period",
  "payment terms",
  "auto-renewal",
  "limitation of liability",
  "confidentiality obligations",
];

export function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useSearch(query);

  function runSearch(value: string) {
    const next = value.trim();
    setInput(value);
    setQuery(next);
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Cross-contract search"
        title={
          <>
            Look across
            <span className="italic text-primary"> every page.</span>
          </>
        }
        description="Search the actual language of every contract in your workspace, not just the file names."
      />

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(input);
        }}
      >
        <div className="rounded-xl border border-ink-100 bg-surface p-2 shadow-card transition-shadow focus-within:shadow-lift">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="e.g. termination notice period, payment terms…"
                aria-label="Search contract text"
                className="h-11 border-0 bg-transparent pl-10 pr-9 shadow-none focus-visible:ring-0"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setQuery("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={!input.trim() || isFetching} className="h-11 gap-2 sm:w-auto">
              {isFetching ? "Searching…" : "Search"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400">
          <span>Semantic search across clause text and page citations</span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> Enter to search
          </span>
        </div>
      </form>

      {!query && (
        <div className="mt-10 rounded-xl border border-ink-100 bg-surface/60 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brass" />
            <p className="rule-label">Try a search</p>
          </div>
          <p className="mt-3 max-w-md font-display text-xl leading-snug text-ink-900">
            Search for the clause you remember, not the file it lives in.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => runSearch(example)}
                className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-primary/30 hover:bg-primary-soft/50 hover:text-ink-900"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-ink-100 bg-surface p-5"
            >
              <Skeleton className="h-2.5 w-40" />
              <Skeleton className="mt-3 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {isError && query && (
        <EmptyState
          className="mt-6"
          icon={SearchIcon}
          title="Search didn't complete."
          description="Check your connection and try the same search again."
          action={
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {data && !isLoading && data.results.length === 0 && (
        <EmptyState
          className="mt-6"
          icon={SearchIcon}
          title="No matching clauses found."
          description="Try different wording, a shorter phrase, or a broader legal term."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setInput("");
                setQuery("");
              }}
            >
              Clear search
            </Button>
          }
        />
      )}

      {data && data.results.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="rule-label">
              {data.results.length} result{data.results.length === 1 ? "" : "s"} for “{data.query}”
            </p>
            {isFetching && (
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-400">
                Updating…
              </span>
            )}
          </div>

          <div className="space-y-3">
            {data.results.map((result, index) => (
              <Link
                key={result.chunk_id}
                to={`/contracts/${result.contract_id}`}
                className="group block rounded-xl border border-ink-100 bg-surface p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lift sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-400">
                    Result {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-ink-200" />
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-brass">
                    Page {result.page_number}
                  </span>
                </div>
                <p className="mt-2 break-words font-display text-lg text-ink-900">
                  {result.contract_display_name}
                </p>
                <p className="mt-2 line-clamp-4 text-[0.8125rem] leading-relaxed text-ink-600">
                  {result.content}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors group-hover:text-accent-hover">
                  Open contract
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/contracts"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              Browse all contracts
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
