import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSearch } from "@/hooks/use-search";

export function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSearch(query);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="font-display text-3xl font-medium text-ink-900">Search</h1>
        <p className="mt-1 text-ink-400">Search across every contract you've uploaded.</p>

        <form
          className="relative mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input);
          }}
        >
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. termination notice period, payment terms..."
            className="pl-9"
          />
        </form>

        {isLoading && <p className="mt-6 text-sm text-ink-400">Searching...</p>}

        {data && data.results.length === 0 && (
          <p className="mt-6 text-sm text-ink-400">No matching clauses found.</p>
        )}

        {data && data.results.length > 0 && (
          <div className="mt-6 space-y-3">
            {data.results.map((result) => (
              <Link key={result.chunk_id} to={`/contracts/${result.contract_id}`}>
                <Card className="transition-colors hover:border-emerald-600">
                  <CardContent className="p-4">
                    <p className="font-mono text-xs uppercase tracking-wide text-ink-400">
                      {result.contract_display_name} &middot; Page {result.page_number}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-600">{result.content}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}