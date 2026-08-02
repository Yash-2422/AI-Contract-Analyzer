import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SearchResponse } from "@/types/api";

export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchResponse>("/search", {
        params: { query, top_k: 15 },
      });
      return data;
    },
    enabled: query.trim().length > 0,
  });
}