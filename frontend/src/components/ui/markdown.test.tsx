import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown } from "@/components/ui/markdown";

describe("Markdown", () => {
  it("renders headings, emphasis, and both list types", () => {
    render(
      <Markdown
        content={[
          "# Comparison report",
          "",
          "This is **important** and *nuanced*.",
          "",
          "- Added clause",
          "- Removed clause",
          "",
          "1. Payment terms",
          "2. Notice period",
        ].join("\n")}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Comparison report" })).toBeInTheDocument();
    expect(screen.getByText("important").tagName).toBe("STRONG");
    expect(screen.getByText("nuanced").tagName).toBe("EM");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getByText("Added clause")).toBeInTheDocument();
    expect(screen.getByText("Notice period")).toBeInTheDocument();
  });

  it("renders GFM-style tables with formatted cells", () => {
    render(
      <Markdown
        content={[
          "| Clause | Assessment |",
          "| --- | :---: |",
          "| Auto-renewal | **High risk** |",
          "| Payment terms | Standard |",
        ].join("\n")}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Clause" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "High risk" })).toBeInTheDocument();
  });

  it("renders fenced code blocks", () => {
    const { container } = render(
      <Markdown content={["```ts", "const risk = 72;", "```"].join("\n")} />,
    );

    expect(container.querySelector("pre code")?.textContent).toContain("const risk = 72;");
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  it("never interprets raw HTML or script tags", () => {
    const { container } = render(
      <Markdown content={"**<script>alert('xss')</script>**"} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
  });

  it("blocks unsafe link protocols", () => {
    render(<Markdown content={"[Click me](javascript:alert)"} />);

    expect(screen.queryByRole("link", { name: "Click me" })).not.toBeInTheDocument();
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders safe external links with hardened rel attributes", () => {
    render(<Markdown content={"[OpenAI](https://openai.com)"} />);

    const link = screen.getByRole("link", { name: "OpenAI" });
    expect(link).toHaveAttribute("href", "https://openai.com/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("turns single line breaks into readable line breaks", () => {
    const { container } = render(<Markdown content={"First line\nSecond line"} />);

    expect(container.querySelector("br")).not.toBeNull();
    expect(screen.getByText(/First line/)).toBeInTheDocument();
  });
});
