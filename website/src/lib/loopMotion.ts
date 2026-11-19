/**
 * Shared by the deck's wordless looping pictures (GenerationLoop,
 * TrainingLoop): building SVG nodes, and Web Animations that leave an element
 * at its end state so the next step can start from it.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
export const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1));

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  parent.append(node);
  return node;
}

/** Animate a transform and leave the element at its end state. */
export async function move(
  node: SVGElement,
  from: string,
  to: string,
  ms: number,
  easing = "ease-in-out",
) {
  const anim = node.animate([{ transform: from }, { transform: to }], {
    duration: ms,
    easing,
    fill: "forwards",
  });
  await anim.finished;
  node.style.transform = to;
  anim.cancel();
}

export async function fade(node: SVGElement, to: number, ms: number) {
  const from = getComputedStyle(node).opacity;
  const anim = node.animate([{ opacity: from }, { opacity: String(to) }], {
    duration: ms,
    fill: "forwards",
  });
  await anim.finished;
  node.style.opacity = String(to);
  anim.cancel();
}

/** True while the element's slide is the one on screen and the tab is visible. */
export const isLive = (root: Element) =>
  root.closest("section")?.classList.contains("present") !== false && !document.hidden;
