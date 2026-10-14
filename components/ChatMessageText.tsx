import { Fragment } from "react";
import {
  parseChatMarkdown,
  type BlockNode,
  type InlineNode,
} from "@/lib/chatMarkdown";

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "bold") {
          return <strong key={i}>{node.value}</strong>;
        }
        if (node.type === "link") {
          return (
            <a
              key={i}
              href={node.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-words hover:text-blue-500 dark:text-blue-400"
            >
              {node.value}
            </a>
          );
        }
        return <Fragment key={i}>{node.value}</Fragment>;
      })}
    </>
  );
}

function Block({ block }: { block: BlockNode }) {
  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((item, i) => (
          <li key={i}>
            <Inline nodes={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      {block.lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <Inline nodes={line} />
        </Fragment>
      ))}
    </p>
  );
}

/** Renders assistant text as React elements only (no dangerouslySetInnerHTML). */
export function ChatMessageText({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words">
      {parseChatMarkdown(text).map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
