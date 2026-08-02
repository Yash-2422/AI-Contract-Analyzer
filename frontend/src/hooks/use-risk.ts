import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { RiskAnalysisResponse } from "@/types/api";

export function useRiskAnalysis(contractId: string) {
  return useQuery({
    queryKey: queryKeys.risk(contractId),
    queryFn: async () => {
      const { data } = await apiClient.get<RiskAnalysisResponse>(
        `/contracts/${contractId}/risk-analysis`,
      );
      return data;
    },
  });
}

export function useRunRiskAnalysis(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<RiskAnalysisResponse>(
        `/contracts/${contractId}/risk-analysis`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.risk(contractId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}