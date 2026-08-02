import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardResponse } from "@/types/api";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardResponse>("/dashboard");
      return data;
    },
  });
}