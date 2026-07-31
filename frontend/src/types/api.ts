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