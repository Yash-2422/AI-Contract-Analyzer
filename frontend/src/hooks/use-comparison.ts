import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ComparisonResponse } from "@/types/api";

export function useComparison(comparisonId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comparison(comparisonId ?? ""),
    queryFn: async () => {
      const { data } = await apiClient.get<ComparisonResponse>(`/comparisons/${comparisonId}`);
      return data;
    },
    enabled: !!comparisonId,
  });
}

export function useCompareContracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contractAId, contractBId }: { contractAId: string; contractBId: string }) => {
      const { data } = await apiClient.post<ComparisonResponse>("/contracts/compare", {
        contract_a_id: contractAId,
        contract_b_id: contractBId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}