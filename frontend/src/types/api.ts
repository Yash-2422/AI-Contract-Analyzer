// Mirrors backend/app/schemas/user.py - keep these in sync when the
// backend schema changes, since nothing enforces it automatically across
// the language boundary.

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// --- Contracts (backend/app/schemas/contract.py) ---

export type ContractStatus = "uploaded" | "processing" | "processed" | "failed";

export interface Contract {
  id: string;
  display_name: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
}

export interface ContractListResponse {
  items: Contract[];
  total: number;
  page: number;
  page_size: number;
}

// --- Dashboard (backend/app/schemas/dashboard.py) ---

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface DashboardResponse {
  total_contracts: number;
  recent_contracts: Contract[];
  storage_used_bytes: number;
  risk_distribution: RiskDistribution;
  chat_sessions_count: number;
  chat_messages_count: number;
  summaries_generated_count: number;
  comparisons_count: number;
  reports_generated_count: number;
}

// --- Summary (backend/app/schemas/user.py-adjacent: schemas/chat.py has SummaryResponse) ---

export interface SummaryResponse {
  id: string;
  contract_id: string;
  content: string;
  created_at: string;
}

// --- Risk (backend/app/schemas/risk.py) ---

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type ClauseCategory =
  | "payment_terms"
  | "termination"
  | "notice_period"
  | "auto_renewal"
  | "confidentiality"
  | "non_compete"
  | "indemnification"
  | "liability"
  | "arbitration"
  | "warranty"
  | "intellectual_property"
  | "obligations"
  | "other";

export interface RiskFinding {
  id: string;
  category: ClauseCategory;
  severity: RiskSeverity;
  title: string;
  explanation: string;
  suggestion: string;
  page_number: number | null;
  created_at: string;
}

export interface RiskAnalysisResponse {
  contract_id: string;
  overall_risk_score: number;
  findings: RiskFinding[];
}

// --- Chat (backend/app/schemas/chat.py) ---

export type MessageRole = "user" | "assistant";

export interface ChatSession {
  id: string;
  contract_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  cited_chunk_ids: string[];
  created_at: string;
}

// --- Comparison (backend/app/schemas/comparison.py) ---

export interface ComparisonResponse {
  id: string;
  contract_a_id: string;
  contract_b_id: string;
  result: string;
  created_at: string;
}

// --- Search (backend/app/schemas/search.py) ---

export interface SearchResultItem {
  chunk_id: string;
  contract_id: string;
  contract_display_name: string;
  page_number: number;
  content: string;
  distance: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}