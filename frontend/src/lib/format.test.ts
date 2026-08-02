import { describe, expect, it } from "vitest";
import { formatBytes, formatDate } from "@/lib/format";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1KB with no decimal", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string into a readable short date", () => {
    const result = formatDate("2026-03-15T10:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("15");
  });
});