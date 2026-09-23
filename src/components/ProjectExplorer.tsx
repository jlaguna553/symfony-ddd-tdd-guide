import type { TreeNode } from "@/lib/project-tree";

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber-500">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400 dark:text-slate-500">
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ExplorerNode({ node }: { node: TreeNode }) {
  return (
    <li className="relative pl-5">
      <span className="absolute left-0 top-2.5 h-px w-4 bg-slate-300 dark:bg-slate-700" />
      <div className="flex items-center gap-1.5 py-0.5 font-mono text-[12.5px] text-slate-700 dark:text-slate-200">
        {node.isFile ? <FileIcon /> : <FolderIcon />}
        <span className={node.isNew ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}>
          {node.name}
        </span>
        {node.isNew && (
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            nuevo
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="ml-2 border-l border-slate-200 dark:border-slate-700">
          {node.children.map((child) => (
            <ExplorerNode key={child.path} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ProjectExplorer({ tree }: { tree: TreeNode | null }) {
  if (!tree || tree.children.length === 0) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        El proyecto todavía no existe. Empezará a tomar forma en la lección{" "}
        <span className="font-semibold">Setup inicial</span>.
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-400">
          <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" fill="currentColor" opacity="0.5" />
        </svg>
        Así va el proyecto hasta esta lección
      </div>
      <div className="max-h-80 overflow-y-auto bg-white p-4 dark:bg-slate-900/60">
        <ul>
          {tree.children.map((child) => (
            <ExplorerNode key={child.path} node={child} />
          ))}
        </ul>
      </div>
    </div>
  );
}
