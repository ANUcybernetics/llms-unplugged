import type { Root } from "mdast";

// Detect inline `prefix` → `token` patterns in MDX and tag the surrounding
// inlineCode nodes with `data-role` so the deck Token component can render
// the prefix as a coloured box and the following token as plain coloured
// text. Triggers on the unicode arrow character (→) between two adjacent
// inlineCode nodes; other inline code stays untagged and renders as a box.
export function remarkCutoutRoles() {
  return (tree: Root) => {
    walk(tree as unknown as ParentLike);
  };
}

interface ParentLike {
  children?: NodeLike[];
}

interface NodeLike extends ParentLike {
  type?: string;
  value?: string;
  data?: { hProperties?: Record<string, string> };
}

function walk(node: ParentLike): void {
  if (!node?.children) return;
  for (let i = 0; i < node.children.length - 2; i++) {
    const a = node.children[i];
    const b = node.children[i + 1];
    const c = node.children[i + 2];
    if (
      a?.type === "inlineCode" &&
      b?.type === "text" &&
      typeof b.value === "string" &&
      /^\s*→\s*$/.test(b.value) &&
      c?.type === "inlineCode"
    ) {
      setRole(a, "prefix");
      setRole(c, "token");
    }
  }
  for (const child of node.children) walk(child);
}

function setRole(node: NodeLike, role: "prefix" | "token"): void {
  node.data ??= {};
  node.data.hProperties ??= {};
  node.data.hProperties["data-role"] = role;
}
