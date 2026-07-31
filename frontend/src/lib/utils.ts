import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes, resolving conflicts (e.g. "p-2 p-4" -> "p-4").
 * Standard shadcn/ui utility - every generated shadcn component expects
 * this to exist at this exact path so future `npx shadcn add` stays
 * compatible.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}