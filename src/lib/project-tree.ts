import { getAllLessons } from "./lessons";

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  isNew: boolean;
  minAddedAt: number;
  children: TreeNode[];
}

interface FileEntry {
  path: string;
  addedAt: number;
}

function collectEntries(): FileEntry[] {
  const entries: FileEntry[] = [];
  for (const lesson of getAllLessons()) {
    for (const p of lesson.newFiles ?? []) {
      entries.push({ path: p, addedAt: lesson.order });
    }
  }
  return entries;
}

function buildFullTree(entries: FileEntry[]): TreeNode {
  const root: TreeNode = {
    name: "ddd-symfony",
    path: "",
    isFile: false,
    isNew: false,
    minAddedAt: Infinity,
    children: [],
  };

  for (const entry of entries) {
    const isFile = !entry.path.endsWith("/");
    const segments = entry.path.replace(/\/$/, "").split("/");

    let current = root;
    let accPath = "";

    segments.forEach((segment, index) => {
      accPath = accPath ? `${accPath}/${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      let child = current.children.find((c) => c.name === segment);

      if (!child) {
        child = {
          name: segment,
          path: accPath,
          isFile: isLeaf ? isFile : false,
          isNew: false,
          minAddedAt: Infinity,
          children: [],
        };
        current.children.push(child);
      }

      child.minAddedAt = Math.min(child.minAddedAt, entry.addedAt);
      current = child;
    });
  }

  const sortRec = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortRec);
  };
  sortRec(root);

  return root;
}

let fullTreeCache: TreeNode | null = null;

function getFullTree(): TreeNode {
  if (!fullTreeCache) {
    fullTreeCache = buildFullTree(collectEntries());
  }
  return fullTreeCache;
}

function pruneAndFlag(node: TreeNode, uptoOrder: number): TreeNode | null {
  if (node.minAddedAt > uptoOrder) return null;

  const children = node.children
    .map((c) => pruneAndFlag(c, uptoOrder))
    .filter((c): c is TreeNode => c !== null);

  return {
    ...node,
    isNew: node.minAddedAt === uptoOrder,
    children,
  };
}

/** Returns the project tree as it exists up to (and including) the given lesson order. */
export function getProjectTreeUpTo(order: number): TreeNode | null {
  const full = getFullTree();

  // The synthetic root never gets its own minAddedAt (only real entries do),
  // so it must not be pruned by the same rule as its children.
  const children = full.children
    .map((c) => pruneAndFlag(c, order))
    .filter((c): c is TreeNode => c !== null);

  return { ...full, isNew: false, children };
}

export function hasAnyFilesUpTo(order: number): boolean {
  const tree = getProjectTreeUpTo(order);
  return !!tree && tree.children.length > 0;
}

export function firstLessonOrderWithFiles(): number {
  const entries = collectEntries();
  return entries.reduce((min, e) => Math.min(min, e.addedAt), Infinity);
}
