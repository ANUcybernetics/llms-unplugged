/**
 * Canonical topic taxonomy for lessons.
 *
 * This is the single source of truth for which topics exist, their order, and
 * their display labels. A lesson is placed into a topic via its `topic`
 * frontmatter (enforced as an enum of these keys in src/content.config.ts), and
 * both the /lessons index and the sidebar derive their grouping from here via
 * src/lib/modules.ts. Add or rename a topic here and everything follows.
 */
export const TOPIC_KEYS = [
  "fundamentals",
  "scaling-up",
  "extending-the-model",
  "shaping-behaviour",
  "looking-inside",
] as const;

export type Topic = (typeof TOPIC_KEYS)[number];

/** Display order of topics across the /lessons index and the sidebar. */
export const topicOrder: readonly Topic[] = TOPIC_KEYS;

export const topicLabels: Record<Topic, string> = {
  fundamentals: "Fundamentals",
  "scaling-up": "Scaling up",
  "extending-the-model": "Extending the model",
  "shaping-behaviour": "Shaping behaviour",
  "looking-inside": "Looking inside",
};

export const topicDescriptions: Record<Topic, string> = {
  fundamentals:
    "Build a bigram model by hand and generate text from it: the train-then-generate loop that everything else builds on.",
  "scaling-up":
    "Run a model you didn't train, and see what a second word of context buys you and what it costs.",
  "extending-the-model":
    "Give the model tools, so it can pause, ask for something outside itself, and carry on.",
  "shaping-behaviour":
    "Change what a model says without changing the mechanism: the sampler, the training data, the judges, and its own output.",
  "looking-inside":
    "Two things a real model does that a bigram can't---learn from the page in front of it, and know that cat is like dog---run by hand.",
};
