import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges plain class strings", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("resolves conflicting Tailwind classes by keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    const isHidden = false;
    expect(cn("px-2", isHidden && "hidden", undefined, null, "text-sm")).toBe("px-2 text-sm");
  });

  it("applies conditional classes from an object", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});