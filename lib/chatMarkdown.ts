/**
 * Tiny, safe renderer model for assistant messages. Supports only **bold**,
 * "- " bullet lists, line breaks and [text](http(s)://...) links. It produces a
 * plain data tree (never HTML), so model output can never inject markup.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; value: string; href: string };

export type BlockNode =
  | { type: "paragraph"; lines: InlineNode[][] }
  | { type: "list"; items: InlineNode[][] };

const INLINE_PATTERN = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;
const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/;

/** Returns a normalised http(s) URL, or null for anything else (javascript:, data:, relative...). */
export function safeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Stray markdown markers that did not form valid syntax are dropped, not shown. */
function cleanText(value: string): string {
  return value.replace(/\*\*/g, "");
}

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) {
      nodes.push({ type: "text", value: cleanText(text.slice(last, index)) });
    }

    if (match[1] !== undefined) {
      nodes.push({ type: "bold", value: cleanText(match[1]) });
    } else {
      const label = cleanText(match[2] ?? "");
      const href = safeHttpUrl(match[3] ?? "");
      // Unsafe URL: keep the visible label as plain text, drop the link.
      nodes.push(
        href ? { type: "link", value: label, href } : { type: "text", value: label },
      );
    }
    last = index + match[0].length;
  }

  if (last < text.length) {
    nodes.push({ type: "text", value: cleanText(text.slice(last)) });
  }
  return nodes.filter((node) => node.value.length > 0);
}

export function parseChatMarkdown(text: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  let paragraph: InlineNode[][] = [];
  let list: InlineNode[][] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length > 0) blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const bullet = line.match(BULLET_PATTERN);
    if (bullet) {
      flushParagraph();
      list.push(parseInline(bullet[1] ?? ""));
    } else if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(parseInline(line.trim()));
    }
  }
  flushParagraph();
  flushList();

  return blocks;
}
