#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Instructor's notes],
  socy_logo: true,
)

== Module 00: Weighted Randomness

=== Discussion questions

- which method feels most "random" to you, and why?
- which is fastest for getting repeated random selections?
- how would you handle weights like 17, 23, 41?
- what happens when one option has 95% probability?
- can you invent your own weighted random selection method?

== Module 01: Basic Training (Building the Model)

=== Discussion questions

- what patterns emerge in your model?
- which words have many possible followers vs just one?
- how does including punctuation as "words" help with sentence structure?
- which words appear most frequently in your training data?
- are there any empty rows? What does that mean?
- how could you use this model to generate _new_ text in the style of your
  input/training data?

=== Connection to modern LLMs

This counting process is exactly what happens during the "training" phase of
language models:

- *training data*: your paragraph vs trillions of words from the internet
- *learning/training process*: hand counting vs automated counting by
  computers
- *storage*: your paper model vs billions of parameters in memory

The key insight: "training" a language model means counting patterns in text.
Your hand-built model contains the same type of information that GPT stores---at
a vastly smaller scale.

== Module 02: Basic Inference (Generating Text)

=== Discussion questions

- how does the starting word affect your generated text?
- why does the text sometimes get stuck in loops?
- what happens when a word only has one possible follower?
- how could you make generation less repetitive?
- does the generated text capture the style of your training text?

=== Connection to modern LLMs

This generation process is identical to how ChatGPT produces text:

- *sequential generation*: both generate one word at a time
- *probabilistic sampling*: both use weighted random selection (exactly like
  your dice or tokens)
- *probability distribution*: neural network outputs probabilities for all
  50,000+ possible next tokens
- *no planning*: neither looks ahead---just picks the next word
- *variability*: same prompt can produce different outputs due to randomness

The surprising fact: ChatGPT's sophisticated responses emerge from this simple
process repeated thousands of times. Your paper model demonstrates that language
generation is fundamentally about sampling from learnt probability
distributions. The randomness is why ChatGPT gives different responses to the
same prompt and why language models can be creative rather than repetitive.
These physical sampling methods demonstrate the exact mathematical operation
happening billions of times per second inside ChatGPT.

== Module 03: Trigram Model

=== Discussion questions

- how does the trigram output compare to basic (bigram) model output?
- what happens when you encounter a word pair you've never seen before?
- how many rows would you need for a 100-word text?
- can you find word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

=== Connection to modern LLMs

The trigram model bridges the gap between simple word-pair models and modern
transformers:

- *context windows*: GPT models use variable context from 2 to 8,000+ tokens
- *sparse data problem*: with more context, you need exponentially more
  training data

Your trigram model shows why longer context helps---`see` + `spot` predicts
`run` perfectly, while just `spot` could be followed by `run` or `,`. This is
why ChatGPT can maintain coherent conversations over many exchanges---it
considers much more context than just the last word or two.

== Module 04: Context Columns (Attention-Lite)

=== Discussion questions

- which context columns are most useful for your text?
- can you think of other helpful context patterns?
- how do context columns reduce repetition in generated text?
- what happens when multiple contexts apply at once?
- are grammatical contexts (verb→object, pronoun→verb) more reliable than
  word-specific ones (`word_a`→`word_b`)?

=== Connection to modern LLMs

Your hand-crafted context columns are what the "attention mechanism" in
transformers learns automatically:

- *manual vs learnt*: you chose 3 grammatical contexts; GPT learns hundreds of
  attention patterns
- *fixed vs dynamic*: your contexts are the same for all words; GPT adapts
  attention per word
- *the innovation*: instead of pre-defining important contexts, transformers
  learn which previous words to "attend to" for each prediction

This is why it's called "attention"---the model learns to pay attention to
relevant context. When GPT predicts the next word after "The capital of France
is", it automatically learns to attend strongly to "capital" and "France" while
ignoring less relevant words. Your grammatical context columns (verb→object,
pronoun→verb) do this manually, while modern AI discovers these patterns---and
many more---through learning.

== Module 05: Word Embeddings

=== Discussion questions

- which words cluster together? why?
- do grammatically similar words have similar embeddings?
- can you predict which words will be close before calculating?
- how do context columns affect word similarity?
- what information is captured in these vectors?

=== Connection to modern LLMs

Word embeddings revolutionised NLP by turning words into numbers that computers
can process:

- *dimensions*: your 8D vectors → GPT uses 768--1536 dimensions
- *learning*: you used occurrence patterns → modern models learn from billions
  of contexts
- *semantic capture*: industrial embeddings encode meaning so well that
  "`king` - `man` + `woman` ≈ `queen`" actually works
- *foundation*: every modern language model starts by converting words to
  embeddings

The breakthrough insight: words with similar meanings appear in similar
contexts, so their usage patterns (and thus embeddings) are similar. Your
hand-calculated vectors demonstrate this principle: `cat` and `dog` would have
similar embeddings because they both follow `the` and precede `ran` or `sat`.
This discovery enabled computers to finally "understand" that words have
relationships and meanings beyond just their spelling.

== Module 06: Sampling Strategies

=== Discussion questions

- which strategy produces the most "human-like" text?
- when would you want predictable vs surprising output?
- how do constraints (haiku, no-repeat) spark creativity?
- can you invent your own sampling strategy?

=== Connection to modern LLMs

ChatGPT and other modern models use these same mechanisms:

*Temperature control*:

- *temperature parameter*: divides probabilities just like you divide
  tallies - higher temperature means more random output

*Truncation techniques*:

- *top-k sampling*: only consider k most likely tokens (truncates rest to
  zero)
- *top-p (nucleus) sampling*: consider tokens until cumulative probability
  reaches p (dynamic truncation)
- *repetition penalty*: discourage repeating recent tokens
- *frequency penalty*: discourage common tokens
- *presence penalty*: discourage any repetition

Your paper model demonstrates that "creativity" in AI comes from two controls:
adjusting temperature (probability distribution shape) and applying truncation
strategies (which tokens to exclude). The same trained model can produce
scholarly essays (low temperature, strict truncation) or wild poetry (high
temperature, constraint-based truncation) just by changing these parameters!

The key insight: generation control is as important as training data. Your paper
model proves that creative output comes not from the model itself, but from how
you control temperature and which tokens you truncate from consideration.

== Module 07: Evaluating Your Language Model

=== Discussion questions

- which metric best captures "good" language?
- how would you weight accuracy vs creativity?
- what's missing from these evaluation methods?
- how might context length affect evaluation?
- why might a model with higher perplexity sometimes be preferable?

=== Connection to modern LLMs

Modern LLMs use these exact same approaches at massive scale:

- *perplexity*: GPT models report perplexity scores on billions of test tokens
- *human evaluation*: OpenAI uses human raters to evaluate ChatGPT responses
- *accuracy benchmarks*: models are tested on standardised question sets
- *diversity metrics*: repetition penalties prevent boring outputs

The key insight: evaluation is about balancing multiple metrics. A model with
perfect accuracy might be boring (always predicting `the`), while a creative
model might produce nonsense. Your physical evaluation mirrors the exact
trade-offs that OpenAI and Anthropic grapple with when training ChatGPT and
Claude!