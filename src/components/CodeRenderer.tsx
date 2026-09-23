import type { ReactElement, ReactNode } from "react";
import { parseCompare, parseFlow, parseTree } from "@/lib/diagrams";
import ArchitectureMap from "./diagrams/ArchitectureMap";
import CompareColumns from "./diagrams/CompareColumns";
import FlowVertical from "./diagrams/FlowVertical";
import TestingPyramid from "./diagrams/TestingPyramid";
import TreeView from "./diagrams/TreeView";
import CopyButton from "./CopyButton";

const DIAGRAM_LANGS = new Set(["flow", "tree", "compare", "pyramid", "architecture"]);

function getLanguage(className?: string | null): string | null {
  if (!className) return null;
  const match = /language-(\w+)/.exec(className);
  return match ? match[1] : null;
}

function textContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (node && typeof node === "object" && "props" in (node as ReactElement)) {
    return textContent((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
}

function renderDiagram(lang: string, raw: string): ReactNode {
  switch (lang) {
    case "flow":
      return <FlowVertical steps={parseFlow(raw)} />;
    case "tree":
      return <TreeView tree={parseTree(raw)} />;
    case "compare":
      return <CompareColumns columns={parseCompare(raw)} />;
    case "pyramid":
      return <TestingPyramid />;
    case "architecture":
      return <ArchitectureMap />;
    default:
      return null;
  }
}

export function PreOverride({ children }: { children?: ReactNode }) {
  const codeEl = Array.isArray(children) ? children[0] : children;

  const isElement =
    codeEl !== null && typeof codeEl === "object" && "props" in (codeEl as ReactElement);

  if (isElement) {
    const element = codeEl as ReactElement<{ className?: string; children?: ReactNode }>;
    const lang = getLanguage(element.props.className);
    const raw = textContent(element.props.children);

    if (lang && DIAGRAM_LANGS.has(lang)) {
      return <>{renderDiagram(lang, raw)}</>;
    }

    return (
      <div className="not-prose group relative my-6">
        <CopyButton text={raw} />
        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1117] p-4 text-[13px] leading-relaxed">
          {children}
        </pre>
      </div>
    );
  }

  return <pre>{children}</pre>;
}

export function CodeOverride({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  if (!className) {
    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-700 dark:bg-slate-800 dark:text-violet-300">
        {children}
      </code>
    );
  }

  return <code className={className}>{children}</code>;
}
