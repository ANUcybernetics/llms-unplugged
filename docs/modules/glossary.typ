#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Glossary: The Language of Language Models],
  socy_logo: true,
)


== Glossary

This glossary connects the physical activities you've been doing with the
technical terms used in modern language models.

=== Core concepts

- *token*: a single unit of text---in our activities, each word or punctuation
  mark (`.`, `,`) is a token. Modern LLMs use subword tokens that can be parts
  of words
- *matrix*: a grid or table showing relationships between tokens. Your
  hand-drawn grids are matrices tracking which words follow other words
- *training*: the process of counting patterns in text to build your matrix.
  When you tallied word transitions, you were "training" your model
- *inference*: using your trained matrix to generate new text. Rolling dice to
  select the next word is inference
- *vocabulary*: all unique tokens your model knows. The words across the top and
  side of your matrix form your vocabulary

=== Model architecture

- *bigram model*: a model that predicts the next word based on one previous word
  (what you built in modules 01-02)
- *trigram model*: a model using two previous words for prediction (module 03)
- *context window*: how many previous tokens the model considers. Bigrams have a
  context window of 1, trigrams have 2, GPT-4 has 128,000+
- *attention mechanism*: the ability to focus on relevant previous words. Your
  context columns (module 04) are a manual form of attention
- *embeddings*: numerical representations of words. Each row in your matrix is
  that word's embedding vector (module 05)

=== Sampling and generation

- *weighted random sampling*: choosing the next token with probability
  proportional to its frequency. Your dice rolls implement this
- *temperature*: a parameter controlling randomness. Dividing tallies by
  temperature (module 06) makes generation more (high temp) or less (low temp)
  random
- *greedy sampling*: always choosing the most likely next word (temperature → 0)
- *beam search*: keeping multiple possible sequences and choosing the best
  overall path (module 06)
- *top-k sampling*: only considering the k most likely next words (like only
  including tokens with 3+ tallies)
- *top-p (nucleus) sampling*: considering words until cumulative probability
  reaches p (like including tokens until you have 90% of tallies)

=== Evaluation metrics

- *perplexity*: a measure of how surprised the model is by text. Lower
  perplexity means the model better predicts real text (module 07)
- *accuracy*: percentage of correct next-word predictions
- *loss*: how wrong the model's predictions are. Training minimises loss by
  adjusting the matrix values

=== Modern LLM concepts

- *parameters*: the numbers stored in the model. Each tally mark in your matrix
  is a parameter. GPT-3 has 175 billion parameters
- *transformer*: the architecture used by GPT, Claude, etc. It uses attention to
  process all words in parallel rather than sequentially
- *fine-tuning*: additional training on specific text. Like adding more tallies
  to your matrix from a new text source
- *prompt*: the starting text you give the model. Your initial word when
  generating text
- *tokenisation*: breaking text into tokens. When you separated "See Spot run."
  into `see` `spot` `run` `.`, you were tokenising
- *hallucination*: when models generate plausible-sounding but false
  information. Happens because models learn patterns, not facts

=== Connections to your activities

#lm-table(
  ([Your Activity], [Real LLM Equivalent]),
  (
    ([Tallying word pairs], [Counting n-grams during training]),
    ([Rolling d20 for next word], [Sampling from probability distribution]),
    ([Matrix rows/columns], [Weight matrices in neural networks]),
    ([Adding context columns], [Learning attention patterns]),
    ([Calculating word distances], [Computing embedding similarities]),
    ([Dividing tallies by temperature], [Applying temperature to logits]),
    ([Keeping top 3 beam paths], [Beam search with beam width 3]),
    ([Checking if model predicts correctly], [Computing cross-entropy loss]),
  ),
)
=== Key insights

+ *Scale is the main difference*: your 6×6 matrix vs billions of parameters, but
  the core concepts are identical

+ *Randomness creates variety*: both your dice and ChatGPT use controlled
  randomness to avoid repetitive output

+ *Context improves prediction*: more context (bigram → trigram → transformer)
  enables better text generation

+ *Embeddings capture meaning*: words used similarly get similar vectors,
  whether hand-calculated or learned by neural networks

+ *Training is just counting*: at its core, training means observing patterns in
  data, exactly what you did with tally marks

The physical activities you've completed demonstrate the fundamental operations
of language models. The main advances in modern AI come from doing these same
operations at massive scale with learned (rather than hand-crafted) patterns.
