import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ChatMessage, ChatSession } from "@/types/api";

export function useChatSessions(contractId: string) {
  return useQuery({
    queryKey: queryKeys.chatSessions(contractId),
    queryFn: async () => {
      const { data } = await apiClient.get<ChatSession[]>(
        `/contracts/${contractId}/chat/sessions`,
      );
      return data;
    },
  });
}

export function useCreateChatSession(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ChatSession>(
        `/contracts/${contractId}/chat/sessions`,
        {},
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions(contractId) });
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chatMessages(sessionId ?? ""),
    queryFn: async () => {
      const { data } = await apiClient.get<ChatMessage[]>(
        `/chat/sessions/${sessionId}/messages`,
      );
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post<ChatMessage>(
        `/chat/sessions/${sessionId}/messages`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}