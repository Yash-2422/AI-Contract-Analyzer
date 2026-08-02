import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Contract, ContractListResponse } from "@/types/api";

export function useContracts(search: string, page: number) {
  return useQuery({
    queryKey: queryKeys.contracts.list(search, page),
    queryFn: async () => {
      const { data } = await apiClient.get<ContractListResponse>("/contracts", {
        params: { search: search || undefined, page, page_size: 20 },
      });
      return data;
    },
  });
}

export function useContract(contractId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(contractId ?? ""),
    queryFn: async () => {
      const { data } = await apiClient.get<Contract>(`/contracts/${contractId}`);
      return data;
    },
    enabled: !!contractId,
    // Poll while processing so the UI reflects uploaded -> processing ->
    // processed/failed without the user having to refresh manually.
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 2000 : false),
  });
}

export function useUploadContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<Contract>("/contracts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useProcessContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data } = await apiClient.post<Contract>(`/contracts/${contractId}/process`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.contracts.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
  });
}

export function useRenameContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contractId, displayName }: { contractId: string; displayName: string }) => {
      const { data } = await apiClient.patch<Contract>(`/contracts/${contractId}`, {
        display_name: displayName,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.contracts.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      await apiClient.delete(`/contracts/${contractId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}