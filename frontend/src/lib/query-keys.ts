/**
 * Centralized query keys. Using a factory instead of ad-hoc arrays scattered
 * across hooks means invalidation (e.g. "refresh the contract list after
 * upload") can't silently miss a spot due to a typo'd key.
 */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  contracts: {
    all: ["contracts"] as const,
    list: (search: string, page: number) => ["contracts", "list", search, page] as const,
    detail: (id: string) => ["contracts", "detail", id] as const,
  },
  summary: (contractId: string) => ["summary", contractId] as const,
  risk: (contractId: string) => ["risk", contractId] as const,
  chatSessions: (contractId: string) => ["chat", "sessions", contractId] as const,
  chatMessages: (sessionId: string) => ["chat", "messages", sessionId] as const,
  comparison: (id: string) => ["comparison", id] as const,
  search: (query: string) => ["search", query] as const,
};