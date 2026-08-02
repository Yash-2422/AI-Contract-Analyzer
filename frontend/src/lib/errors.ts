import { AxiosError } from "axios";
import type { ApiError } from "@/types/api";

export function getErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof AxiosError && err.response?.data) {
    const apiError = err.response.data as ApiError;
    return apiError.message ?? fallback;
  }
  return fallback;
}