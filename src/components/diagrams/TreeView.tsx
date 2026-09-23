import type { ParsedTree, TreeParseNode } from "@/lib/diagrams";

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber-500">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400 dark:text-slate-500">
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function looksLikeFile(label: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(label.replace(/\/$/, ""));
}

function FilesNode({ node }: { node: TreeParseNode }) {
  const isFile = looksLikeFile(node.label) && node.children.length === 0;

  return (
    <li className="relative pl-5">
      <span className="absolute left-0 top-2.5 h-px w-4 bg-slate-300 dark:bg-slate-600" />
      <div className="flex items-center gap-1.5 py-0.5 font-mono text-[13px] text-slate-700 dark:text-slate-200">
        {isFile ? <FileIcon /> : <FolderIcon />}
        <span>{node.label.replace(/\/$/, "")}</span>
      </div>
      {node.children.length > 0 && (
        <ul className="ml-2 border-l border-slate-200 dark:border-slate-700">
          {node.children.map((child, i) => (
            <FilesNode key={i} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FlowNode({ node }: { node: TreeParseNode }) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-4 h-px w-4 bg-slate-300 dark:bg-slate-600" />
      <div className="my-1 inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        {node.label}
      </div>
      {node.children.length > 0 && (
        <ul className="ml-3 border-l border-dashed border-slate-300 dark:border-slate-600">
          {node.children.map((child, i) => (
            <FlowNode key={i} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TreeView({ tree }: { tree: ParsedTree }) {
  const Node = tree.variant === "files" ? FilesNode : FlowNode;

  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <ul>
        {tree.roots.map((node, i) => (
          <Node key={i} node={node} />
        ))}
      </ul>
    </div>
  );
}
