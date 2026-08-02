import axios from "axios";
import type { ApiError } from "@/types/api";

export function getErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  // axios.isAxiosError() is a duck-typed check, unlike `err instanceof
  // AxiosError` - the latter silently fails whenever there's more than
  // one copy of the axios module in node_modules (common: a dependency
  // like axios-mock-adapter bundling its own axios), because the error
  // was constructed by a different AxiosError class reference.
  if (axios.isAxiosError(err) && err.response?.data) {
    const apiError = err.response.data as ApiError;
    return apiError.message ?? fallback;
  }
  return fallback;
}