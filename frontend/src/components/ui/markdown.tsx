import {
  createElement,
  Fragment,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A deliberately small, dependency-free Markdown renderer for AI output.
 *
 * Safety model: Markdown is parsed into React elements only - raw HTML is
 * never interpreted and `dangerouslySetInnerHTML` is never used. Links are
 * restricted to http(s), mailto, root-relative, and fragment URLs.
 */

type KeyFactory = () => string;

function makeKeyFactory(prefix: string): KeyFactory {
  let index = 0;
  return () => `${prefix}-${index++}`;
}

const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (!SAFE_PROTOCOLS.test(value)) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.href;
  } catch {
    return null;
  }
}

function externalLinkProps(href: string) {
  if (href.startsWith("#") || href.startsWith("/")) return {};
  return { target: "_blank", rel: "noopener noreferrer nofollow" };
}

const INLINE_PATTERN_SOURCE = [
  /\\[\\`*_{}[\]()#+\-.!>]/.source,
  /`[^`\n]+`/.source,
  /\*\*(?:(?!\*\*).)+\*\*/.source,
  /__(?:(?!__).)+__/.source,
  /~~(?:(?!~~).)+~~/.source,
  /\[[^\]]+\]\([^)\s]+(?:\s+["'][^"']*["'])?\)/.source,
  /(?<!\w)_(?:(?!_).)+_(?!\w)/.source,
  /\*(?:(?!\*).)+\*/.source,
  /https?:\/\/[^\s<]+/.source,
  /<(?:https?:\/\/[^>\s]+)>/.source,
].join("|");

function renderInline(
  text: string,
  keyFactory: KeyFactory,
  allowLinks = true,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(INLINE_PATTERN_SOURCE, "g");
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = keyFactory();

    if (token.startsWith("\\") && token.length > 1) {
      nodes.push(token.slice(1));
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      nodes.push(
        <strong key={key}>
          {renderInline(token.slice(2, -2), keyFactory, allowLinks)}
        </strong>,
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      nodes.push(
        <del key={key}>{renderInline(token.slice(2, -2), keyFactory, allowLinks)}</del>,
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const labelEnd = token.indexOf("](");
      const label = token.slice(1, labelEnd);
      const destination = token
        .slice(labelEnd + 2, -1)
        .replace(/\s+["'][^"']*["']\s*$/, "");
      const href = allowLinks ? safeHref(destination) : null;
      nodes.push(
        href ? (
          <a key={key} href={href} {...externalLinkProps(href)}>
            {renderInline(label, keyFactory, false)}
          </a>
        ) : (
          <Fragment key={key}>{renderInline(label, keyFactory, false)}</Fragment>
        ),
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      nodes.push(
        <em key={key}>{renderInline(token.slice(1, -1), keyFactory, allowLinks)}</em>,
      );
    } else if (allowLinks && /^<?https?:\/\//i.test(token)) {
      const raw = token.replace(/^</, "").replace(/>$/, "");
      const trailing = raw.match(/[.,;:!?]+$/)?.[0] ?? "";
      const url = trailing ? raw.slice(0, -trailing.length) : raw;
      const href = safeHref(url);
      if (href) {
        nodes.push(
          <a key={key} href={href} {...externalLinkProps(href)}>
            {url}
          </a>,
        );
        if (trailing) nodes.push(trailing);
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderLines(text: string, keyFactory: KeyFactory): ReactNode[] {
  const lines = text.split("\n");
  return lines.flatMap((line, index) => {
    const lineNodes = renderInline(line, keyFactory);
    if (index === lines.length - 1) return lineNodes;
    return [...lineNodes, <br key={keyFactory()} />];
  });
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; copying is a convenience only.
    }
  }

  return (
    <div className="group/code relative">
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {language && (
          <span className="rounded bg-ink-900/5 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ink-400">
            {language}
          </span>
        )}
        <button
          type="button"
          onClick={copyCode}
          aria-label="Copy code"
          className="rounded-md border border-ink-100 bg-surface p-1.5 text-ink-400 opacity-0 transition-all hover:text-ink-900 focus-visible:opacity-100 group-hover/code:opacity-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function splitTableRow(row: string): string[] {
  let value = row.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      current += char === "|" ? "|" : `\\${char}`;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}

function isTableDelimiter(line: string): boolean {
  if (!line.includes("|")) return false;
  return splitTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableAlignment(token: string): "left" | "center" | "right" {
  const starts = token.startsWith(":");
  const ends = token.endsWith(":");
  if (starts && ends) return "center";
  if (ends) return "right";
  return "left";
}

function isListLine(line: string): boolean {
  return /^(\s*)([-+*]|\d+[.)])\s+/.test(line);
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];
  if (!line || !line.trim()) return true;
  if (/^ {0,3}(```|~~~)/.test(line)) return true;
  if (/^ {0,3}#{1,6}\s+/.test(line)) return true;
  if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) return true;
  if (/^ {0,3}>\s?/.test(line)) return true;
  if (isListLine(line)) return true;
  if (line.includes("|") && lines[index + 1] && isTableDelimiter(lines[index + 1])) return true;
  return false;
}

function renderBlocks(lines: string[], keyFactory: KeyFactory): ReactNode[] {
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Fenced code block
    const fence = line.match(/^ {0,3}(```|~~~)\s*([\w+-]*)\s*$/);
    if (fence) {
      const marker = fence[1];
      const language = fence[2] || undefined;
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(marker)) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <CodeBlock key={keyFactory()} code={codeLines.join("\n")} language={language} />,
      );
      continue;
    }

    // ATX heading
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], keyFactory);
      blocks.push(createElement(`h${Math.min(level, 4)}`, { key: keyFactory() }, content));
      index += 1;
      continue;
    }

    // Horizontal rule
    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<hr key={keyFactory()} />);
      index += 1;
      continue;
    }

    // Blockquote
    if (/^ {0,3}>/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && (/^ {0,3}>/.test(lines[index]) || !lines[index].trim())) {
        quoteLines.push(lines[index].replace(/^ {0,3}>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={keyFactory()}>{renderBlocks(quoteLines, keyFactory)}</blockquote>,
      );
      continue;
    }

    // Table
    if (line.includes("|") && lines[index + 1] && isTableDelimiter(lines[index + 1])) {
      const header = splitTableRow(line);
      const alignments = splitTableRow(lines[index + 1]).map(tableAlignment);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push(
        <div className="markdown-table-wrap" key={keyFactory()}>
          <table>
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex} style={{ textAlign: alignments[cellIndex] ?? "left" }}>
                    {renderInline(cell, keyFactory)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {header.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{ textAlign: alignments[cellIndex] ?? "left" }}
                    >
                      {renderInline(row[cellIndex] ?? "", keyFactory)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Lists (nested lists are re-parsed from each item's indented lines)
    const listMatch = line.match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
    if (listMatch) {
      const baseIndent = listMatch[1].length;
      const ordered = /^\d/.test(listMatch[2]);
      const start = ordered ? Number.parseInt(listMatch[2], 10) : 1;
      const items: string[][] = [];
      let listIndex = index;

      while (listIndex < lines.length) {
        const itemMatch = lines[listIndex].match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
        if (!itemMatch) break;
        const indent = itemMatch[1].length;
        const itemOrdered = /^\d/.test(itemMatch[2]);
        if (indent < baseIndent) break;
        if (indent === baseIndent && itemOrdered !== ordered) break;

        if (indent === baseIndent) {
          items.push([itemMatch[3]]);
        } else if (items.length > 0) {
          items[items.length - 1].push(lines[listIndex].slice(baseIndent));
        }
        listIndex += 1;
      }

      const listItems = items.map((itemLines) => (
        <li key={keyFactory()}>{renderBlocks(itemLines, keyFactory)}</li>
      ));

      blocks.push(
        ordered ? (
          <ol key={keyFactory()} start={start}>
            {listItems}
          </ol>
        ) : (
          <ul key={keyFactory()}>{listItems}</ul>
        ),
      );

      index = listIndex;
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block.
    const paragraphLines: string[] = [line];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(
      <p key={keyFactory()}>{renderLines(paragraphLines.join("\n"), keyFactory)}</p>,
    );
  }

  return blocks;
}

export interface MarkdownProps {
  content: string;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Markdown({ content, className, as = "div" }: MarkdownProps) {
  if (!content?.trim()) return null;
  const keyFactory = makeKeyFactory("md");
  const normalized = content.replace(/\r\n?/g, "\n");
  const children = renderBlocks(normalized.split("\n"), keyFactory);

  return createElement(
    as,
    { className: cn("markdown-body", className) },
    children,
  );
}

export function MarkdownInline({
  content,
  className,
}: {
  content: string;
  className?: string;
} & Pick<ComponentPropsWithoutRef<"span">, "aria-label">) {
  const keyFactory = makeKeyFactory("mdi");
  return <span className={className}>{renderInline(content, keyFactory)}</span>;
}
