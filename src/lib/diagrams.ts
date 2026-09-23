export interface FlowStep {
  label: string;
  reversed: boolean;
}

export function parseFlow(raw: string): FlowStep[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      const reversed = line.startsWith("^");
      return {
        label: reversed ? line.slice(1).trim() : line,
        reversed,
      };
    });
}

export interface TreeParseNode {
  label: string;
  depth: number;
  children: TreeParseNode[];
}

export interface ParsedTree {
  variant: "files" | "flow";
  roots: TreeParseNode[];
}

export function parseTree(raw: string): ParsedTree {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  let variant: "files" | "flow" = "flow";
  let body = lines;

  if (lines[0]?.trim() === "!files") {
    variant = "files";
    body = lines.slice(1);
  } else if (lines[0]?.trim() === "!flow") {
    variant = "flow";
    body = lines.slice(1);
  }

  const roots: TreeParseNode[] = [];
  const stack: { depth: number; node: TreeParseNode }[] = [];

  for (const rawLine of body) {
    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const depth = Math.floor(indent / 2);
    const label = rawLine.trim();

    const node: TreeParseNode = { label, depth, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth, node });
  }

  return { variant, roots };
}

export interface CompareColumn {
  title: string | null;
  steps: FlowStep[];
}

export function parseCompare(raw: string): CompareColumn[] {
  const blocks = raw.split(/\n\s*---\s*\n/);

  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    let title: string | null = null;
    let rest = lines;

    if (lines[0]?.startsWith("# ")) {
      title = lines[0].slice(2).trim();
      rest = lines.slice(1);
    }

    return {
      title,
      steps: parseFlow(rest.join("\n")),
    };
  });
}
