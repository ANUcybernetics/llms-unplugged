export const topicOrder = [
  "fundamentals",
  "scaling-up",
  "controlling-output",
  "how-models-understand",
  "adaptation-and-data",
];

export const topicLabels: Record<string, string> = {
  fundamentals: "Fundamentals",
  "scaling-up": "Scaling up",
  "controlling-output": "Controlling output",
  "how-models-understand": "How models understand",
  "adaptation-and-data": "Adaptation and data",
};

export const topicDescriptions: Record<string, string> = {
  fundamentals:
    "Core concepts for building and using language models. Start here to learn weighted random selection, training a bigram model, and generating text.",
  "scaling-up":
    "Move beyond hand-built models to explore pre-trained models and longer context windows with trigrams.",
  "controlling-output":
    "Learn how sampling strategies like temperature and truncation shape generated text without changing the underlying model.",
  "how-models-understand":
    "Explore how models use context and represent word meaning through embeddings.",
  "adaptation-and-data":
    "Discover how models are customised for specific tasks and the risks of training on synthetic data.",
};
