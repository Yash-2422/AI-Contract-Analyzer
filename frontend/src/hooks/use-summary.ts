import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SummaryResponse } from "@/types/api";

export function useSummary(contractId: string) {
  return useQuery({
    queryKey: queryKeys.summary(contractId),
    queryFn: async () => {
      const { data } = await apiClient.get<SummaryResponse>(`/contracts/${contractId}/summary`);
      return data;
    },
    retry: (failureCount, error) => {
      // 404 just means "no summary generated yet" - not worth retrying.
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useGenerateSummary(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SummaryResponse>(`/contracts/${contractId}/summary`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.summary(contractId), data);
    },
  });
}