#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Poetry Slam],
  socy_logo: true,
  dark: sys.inputs.at("anu_theme", default: "dark") == "dark",
)


== Description

A flexible culminating activity where teams compete to generate the best beat
poetry from their hand-built language models. This Poetry Slam can be run after
completing module 02 (Basic Inference) or any later module, allowing
participants to showcase whatever techniques they've learned so far. The
activity scales naturally - teams with more modules completed have more tools
available, but creative use of basic techniques can still win!

== Prerequisites

Minimum requirements:

- Weighted Random Sampling (module 00)
- Basic Training (module 01)
- Basic Inference (module 02)

But you can also incorporate techniques from any of the subsequent modules.

== Materials

- your completed word co-occurrence matrix (from module 01-02)
- any additional materials from completed modules:
  - context columns (if you've done module 04)
  - word embeddings (if you've done module 05)
  - sampling strategy notes (if you've done module 06)
- score sheets for evaluation
- timer for poetry performances
- optional: microphone for dramatic readings
- snapping fingers for beat poet ambience

== Activity Steps

+ *setup phase*:

  - each team identifies which modules they've completed
  - select your best model configuration from available tools
  - if you have module 04: choose which context columns to use
  - if you have module 06: select your sampling strategy
  - if you have module 03: decide whether to use bigram or trigram

+ *poetry generation round*:

  - generate a 20-30 word poem using your available techniques
  - basic teams (modules 01-02): focus on creative prompt selection
  - if you have module 04: use context columns for rhythm and flow
  - if you have module 05: apply embedding similarity for word substitutions
  - if you have module 06: apply your chosen sampling strategy

+ *team choices* (based on completed modules):
  - *everyone*: starting word/prompt selection
  - *if module 03*: bigram vs trigram
  - *if module 04*: which context columns to activate
  - *if module 06*: which sampling strategy to use
  - *if module 05*: whether to use similarity-based substitutions

== Example Performances

=== Team A (modules 01-02 only):

- *modules completed*: basic training + inference
- *strategy*: creative prompt chaining
- *result*: "run spot see jump play fast run"
- *technique*: carefully selected starting words for variety

=== Team B (modules 01-04):

- *modules completed*: through context columns
- *model*: bigram for simplicity
- *context columns*: `.` for structure
- *result*: "see spot run. spot jumps high. good dog."
- *technique*: Used full stops to create clear sentences

=== Team C (modules 01-03 + 06):

- *modules completed*: trigram + sampling strategies (skipped 04-05)
- *model*: trigram for better flow
- *sampling*: poetry slam (rhyme-seeking) strategy
- *result*: "run fun sun! spot got hot! see me free!"
- *technique*: combined trigram coherence with rhyming

=== Team D (all modules):

- *modules completed*: all through module 06
- *model*: trigram
- *context columns*: all available
- *sampling*: non-sequitur for surprise
- *embeddings*: heavy substitution
- *result*: "purple elephant yesterday! quantum spot transcends!"
- *technique*: maximum chaos with all tools combined

== Discussion Questions

- which combination of techniques produced the best poetry?
- did teams with more modules necessarily create better poems?
- how can creative use of basic techniques compete with advanced ones?
- what makes generated text feel "poetic"?
- which team made the best strategic choices given their available tools?
- how did teams adapt their strategies to the modules they'd completed?

== Advanced Extensions

=== Poetry forms challenge

Attempt different forms with whatever modules you have:

- *beat Poetry* (needs 03+04+06): trigram + poetry slam sampling + EXCLAIM
- *nature Haiku* (needs 04+06): bigram + haiku sampling + START/`.`
- *concrete Poetry* (any level): any model + visual arrangement of output
- *stream of consciousness* (needs 03): trigram + random sampling
- *simple chant* (modules 01-02 only): repetitive patterns with basic model

=== Collaborative poem

- teams take turns generating one line each
- each team uses whatever techniques they have available
- build a collective poem showcasing different capability levels
- perform as a group piece

=== Found poetry

- generate 50 words using whatever method you have
- manually arrange into a poem
- works equally well with basic or advanced techniques
- performance combines AI generation with human curation

== Connection to Modern LLMs

Your poetry slam demonstrates core principles of how ChatGPT works, regardless
of which modules you've completed:

- *even basic models create poetry*: teams with just modules 01-02 can still
  generate creative text, showing that the foundation is statistical patterns
- *each layer adds capability*: as teams complete more modules, they gain more
  control - just like how GPT layers many techniques
- *no single magic component*: teams with all modules don't automatically win -
  success comes from using available tools creatively

The key insight: Modern language models are essentially doing what you're doing,
just scaled up:

- *if you have modules 01-02*: you're doing core statistical generation (GPT's
  foundation)
- *if you add module 03*: you're adding context awareness (like attention)
- *if you add module 04*: you're adding structure (like special tokens)
- *if you add module 05*: you're adding semantic understanding (like embeddings)
- *if you add module 06*: you're adding creative control (like GPT's parameters)

Your poetry slam proves that "intelligence" in AI builds incrementally. Whether
you have 2 modules or 6, you're demonstrating the same principles that power
GPT-4---it just has billions of parameters instead of your paper matrix.

The art isn't in having all the components; it's in creatively using what you
have.
