/**
 * Canonical topic taxonomy for lessons.
 *
 * This is the single source of truth for which topics exist, their order, and
 * their display labels. A lesson is placed into a topic via its `topic`
 * frontmatter (enforced as an enum of these keys in src/content.config.ts), and
 * both the /lessons index and the sidebar derive their grouping from here via
 * src/lib/lessons.ts. Add or rename a topic here and everything follows.
 */
export const TOPIC_KEYS = [
  "fundamentals",
  "scaling-up",
  "controlling-output",
  "how-models-understand",
  "adaptation-and-data",
] as const;

export type Topic = (typeof TOPIC_KEYS)[number];

/** Display order of topics across the /lessons index and the sidebar. */
export const topicOrder: readonly Topic[] = TOPIC_KEYS;

export const topicLabels: Record<Topic, string> = {
  fundamentals: "Fundamentals",
  "scaling-up": "Scaling up",
  "controlling-output": "Controlling output",
  "how-models-understand": "Context and meaning",
  "adaptation-and-data": "Adaptation and data",
};

export const topicDescriptions: Record<Topic, string> = {
  fundamentals:
    "Core concepts for building and using language models. Train a bigram model by hand and generate text.",
  "scaling-up":
    "Move beyond hand-built models to explore pre-trained models and longer context windows with trigrams.",
  "controlling-output":
    "Learn how sampling strategies like temperature and truncation shape generated text without changing the underlying model.",
  "how-models-understand":
    "Explore how models use context and represent word meaning through embeddings.",
  "adaptation-and-data":
    "Discover how models are customised for specific tasks and the risks of training on synthetic data.",
};
