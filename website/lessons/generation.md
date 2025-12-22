---
title: Generation
description:
  Use your hand-built bigram model to generate new text through weighted random
  sampling.
order: 2
topic: fundamentals
keyIdea:
  Language models generate text one word at a time by sampling the next word
  according to learned counts.
---

# Generation

<VariantToggle />

<GridOnly>

::: tip Weighted randomness

This lesson involves rolling dice to sample from weighted probability
distributions. If your students need extra support with this concept, consider
running the [Weighted Randomness](/lessons/weighted-randomness) lesson first.

:::

</GridOnly>

Use a pre-trained (hand-built) bigram model to generate new text through
weighted random sampling.

<GridOnly>

![Hero image: Grid Generation](/assets/images/hero-grid-generation.avif)

</GridOnly>

<BucketOnly>

![Hero image: Bucket Generation](/assets/images/hero-bucket-generation.avif)

</BucketOnly>

<Prerequisites />

## You will need

<GridOnly>

- your completed bigram model from _Training_
- a d10 (or similar) for weighted sampling
- pen and paper for jotting down the generated text

</GridOnly>

<BucketOnly>

- your completed bucket model from _Training_
- pen and paper for writing down the generated text

</BucketOnly>

## Your goal

Generate new text from your bigram language model. Stretch goal: keep going and
write a whole story.

## Key idea

<GridOnly>

A language model proposes several possible next words along with how likely each
is. Dice rolls pick among those options, and repeating the process word by word
yields fluent text.

</GridOnly>

<BucketOnly>

A language model proposes several possible next words. In the bucket model, each
bucket contains all the tokens that could come next---and some tokens appear
multiple times, making them more likely to be picked. Choosing randomly from a
bucket and repeating the process word by word creates new text.

</BucketOnly>

## Algorithm

<GridOnly>

1. Choose a starting word from the first column of your grid.
2. Look at that word's row to find all possible next words and their counts.
3. Roll dice weighted by the counts (see _Weighted Randomness_).
4. Write down the chosen word and make it your new starting word.
5. Repeat from step 2 until you hit a natural stopping point (e.g., `.`) or your
   desired length.

</GridOnly>

<BucketOnly>

1. Choose a starting bucket and write down its label---this is the first word of
   your generated text.
2. Close your eyes and pick a random token from inside that bucket.
3. Write down the token you picked.
4. Put the token back in the bucket (so you can use it again later).
5. Find the bucket whose label matches the token you just picked.
6. Repeat from step 2 until you reach a stopping point (e.g. an empty bucket or
   your desired length).

</BucketOnly>

## Example

Before you try generating text yourself, work through this example to see the
algorithm in action.

<GridOnly>

Using the same bigram model from the example in _Training_:

<LmGrid tokens="see spot run . see spot jump . run , spot , run . jump , spot , jump ." />

- choose (for example) `see` as your starting word
- `see` (row) → `spot` (column); it's the only option, so write down `spot` as
  next word
- `spot` → `run` (25%), `jump` (25%) or `,` (50%); roll dice to choose
- let's say dice picks `run`; write it down
- `run` → `.` (67%) or `,` (33%); roll dice to choose
- let's say dice picks `.`; write it down
- `.` → `see` (33%), `run` (33%) or `jump` (33%); roll dice to choose
- let's say dice picks `see`; write it down
- `see` → `spot`; it's the only option, so write down `spot`... and so on

After the above steps, the generated text is _"see spot run. see spot"_

</GridOnly>

<BucketOnly>

Using the bucket model from the example in _Training_:

| Bucket label | Tokens inside |
| ------------ | ------------- |
| see          | `spot` `spot` |
| spot         | `run` `jump`  |
| run          | `.`           |
| .            | `see`         |
| jump         | `.`           |

**Generation sequence:**

1. Choose `see` as starting bucket---write down "see"
2. Pick randomly from the "see" bucket---both tokens are `spot`, so we get
   `spot`---write it down
3. Move to the "spot" bucket---pick randomly between `run` and `jump`
4. Let's say we pick `run`---write it down
5. Move to the "run" bucket---only `.` is inside, so we get `.`---write it down
6. Move to the "." bucket---only `see` is inside, so we get `see`---write it
   down
7. Move to the "see" bucket---pick `spot` again---write it down
8. Move to the "spot" bucket---this time let's say we pick `jump`---write it
   down
9. Move to the "jump" bucket---only `.` is inside---write it down
10. The "." bucket still has a token, so we could continue, or stop here

**Generated text:** _"see spot run. see spot jump."_

Notice how the randomness comes from physically picking tokens without looking.
Buckets with more tokens of the same type are more likely to produce that
token---the "see" bucket always produces `spot` because that's all it contains.

</BucketOnly>

## Instructor notes

### Discussion questions

<GridOnly>

- how does the starting word affect your generated text?
- why does the text sometimes get stuck in loops?
- if this is a _bigram_ (i.e. 2-gram) model, how would a unigram (1-gram) model
  work?
- how could you make generation less repetitive?
- does the generated text capture the style of your training text?

</GridOnly>

<BucketOnly>

- how does the starting bucket affect your generated text?
- why might the text sometimes get stuck repeating the same pattern?
- what happens when a bucket only has one token inside?
- why do we put the token back after picking it?
- does the generated text sound like the original training text?

</BucketOnly>

### Connection to current LLMs

This generation process is identical to how current LLMs produce text:

- **sequential generation**: both generate one word at a time
- **probabilistic sampling**: both use weighted random selection (exactly like
  your dice or tokens)
- **probability distribution**: neural network outputs probabilities for all
  50,000+ possible next tokens
- **no planning**: neither looks ahead---just picks the next word
- **variability**: same prompt can produce different outputs due to randomness

The fact: sophisticated AI responses emerge from this simple process repeated
thousands of times. Your paper model demonstrates that language generation is
fundamentally about sampling from learned probability distributions. The
randomness is why LLMs give different responses to the same prompt and why
language models can be creative rather than repetitive. These physical sampling
methods demonstrate the exact mathematical operation happening billions of times
per second inside modern language models.

<GridOnly>

Note: in AI/ML more broadly, this process of using a trained model to produce
outputs is commonly called "inference"---you may encounter this term in other
contexts. In these teaching resources we use "generation" specifically because
it more clearly describes what language models do: they generate text.

</GridOnly>

<BucketOnly>

### Comparison to dice method

This bucket method and the dice method produce equivalent results:

- dice rolls with weighted probabilities select from options based on counts
- bucket picking selects from options where counts are represented by multiple
  physical tokens
- buckets make the probability tangible---a bucket with three `spot` tokens and
  one `run` token gives `spot` a 75% chance, just like weighted dice would

The bucket method avoids the need to calculate percentages or understand dice
mechanics, making it more accessible for younger learners.

</BucketOnly>

## Interactive widget

<GridOnly>

Step through the generation process at your own pace. Click on a row to select a
starting word, then press Play or Step to watch the dice roll and text being
generated. You can also edit the training text to create your own model.

<GenerationWidget
  initialText="See spot run. See spot jump. Run, Spot, run. Jump, Spot, jump."
  :diceSides="10"
/>

</GridOnly>

<BucketOnly>

Step through the generation process at your own pace. Click on a bucket to
select a starting word, then press Play or Step to watch tokens being picked
randomly and text being generated. You can also edit the training text to create
your own model.

<BucketGenerationWidget />

</BucketOnly>
