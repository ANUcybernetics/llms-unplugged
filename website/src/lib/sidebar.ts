/**
 * Lesson slugs shown in the site sidebar, in display order.
 *
 * Grouped into the two top-level sections mirrored on the /lessons/ index
 * page. We keep the list explicit (rather than showing every lesson in the
 * content collection) so that lessons like `intro` — which are linked from
 * specific pages but aren't part of the canonical lesson flow — don't end up
 * in the nav.
 *
 * Single source of truth: both `Sidebar.astro` and `test/lessonConsistency`
 * import from here, so renaming or removing a slug surfaces as a type error
 * or a failing test rather than a silently broken sidebar.
 */
export const FUNDAMENTALS = ["weighted-randomness", "training", "generation"] as const;

export const EXTENSIONS = [
  "pretrained-generation",
  "more-context",
  "sampling",
  "agentic-tool-use",
  "sycophancy",
  "in-context-memory",
  "induction-heads",
  "word-embeddings",
  "lora",
  "rlhf",
  "synthetic-data",
] as const;

export type LessonSlug = (typeof FUNDAMENTALS)[number] | (typeof EXTENSIONS)[number];

export const SIDEBAR_SLUGS: readonly LessonSlug[] = [...FUNDAMENTALS, ...EXTENSIONS];
