---
title: "Context Columns (Attention-Lite)"
prereqs: ["01-basic-training.md", "02-basic-inference.md"]
---

## Description

Enhance your word co-occurence matrix with context columns that capture
grammatical and semantic patterns. This activity introduces the concept of
attention---selectively focusing on relevant context---which is the key
innovation behind transformer models like GPT.

## Materials

- same as basic-training module
- your completed word co-occurence matrix from
  [basic training](01-basic-training.md)
- different coloured pens for context columns

## Core concepts

Attention means selectively focusing on relevant context. By adding grammatical
context columns to your matrix, you manually implement what transformers learn
automatically---which previous words matter most for prediction.

## Activity steps

1. **identify patterns** in your text (let participants discover these)
   - which words come after action words (verbs)?
   - which words follow `i`, `you`, `they` (pronouns)?
   - which words come after `in`, `on`, `at` (prepositions)?
   - how do these patterns differ from random transitions?
2. **add context columns** to your existing word co-occurence matrix:
   - after_verb: count if this word appears after doing/action words
   - after_pronoun: count if this word follows `i`/`you`/`they`/etc.
   - after_preposition: count if this word comes after
     `in`/`on`/`at`/`with`/`to`/etc.
3. **generate with context weighting**:
   - start with a word and check its row
   - sum the base transition counts with relevant context columns
   - weight your d20 rolls by these combined scores
   - context makes common patterns more likely

## Example

Original text: _"I run, fast. You run to me."_

Tokenised: `i` `run` `,` `fast` `.` `you` `run` `to` `me` `.`

Enhanced matrix with context columns:

|       | `i` | `you` | `run` | `,` | `fast` | `to` | `me` | `.` | after verb | after pronoun | after preposition |
| ----- | --- | ----- | ----- | --- | ------ | ---- | ---- | --- | ---------- | ------------- | ----------------- |
| `i`   | 0   | 0     | 1     | 0   | 0      | 0    | 0    | 0   | 0          | 0             | 0                 |
| `you` | 0   | 0     | 1     | 0   | 0      | 0    | 0    | 0   | 0          | 0             | 0                 |
| `run` | 0   | 0     | 0     | 1   | 0      | 1    | 0    | 0   | 0          | 2             | 0                 |
| `,`   | 0   | 0     | 0     | 0   | 1      | 0    | 0    | 0   | 0          | 0             | 0                 |
| `fast`| 0   | 0     | 0     | 0   | 0      | 0    | 0    | 1   | 0          | 0             | 0                 |
| `to`  | 0   | 0     | 0     | 0   | 0      | 0    | 1    | 0   | 1          | 0             | 0                 |
| `me`  | 0   | 0     | 0     | 0   | 0      | 0    | 0    | 1   | 0          | 0             | 1                 |
| `.`   | 0   | 1     | 0     | 0   | 0      | 0    | 0    | 0   | 0          | 0             | 0                 |

When generating after `run` (a verb):

- check `run` row: next words are `,` (1) or `to` (1)
- check **after verb** column: `to` has value 1 (appears after verbs)
- combine both signals: `to` is strongly predicted after `run`
- this captures the verb→preposition pattern

## Discussion questions

- which context columns are most useful for your text?
- can you think of other helpful context patterns?
- how do context columns reduce repetition in generated text?
- what happens when multiple contexts apply at once?
- are grammatical contexts (verb→object, pronoun→verb) more reliable than
  word-specific ones (`word_a`→`word_b`)?

## Activity variations

- **context discovery**: teams compete to find the most useful context pattern
- **ablation study**: generate with and without each context column
- **custom contexts**: design context columns for different text types (poetry,
  dialogue, recipes)

## Connection to modern LLMs

Your hand-crafted context columns are what the "attention mechanism" in
transformers learns automatically:

- **manual vs learnt**: you chose 3 grammatical contexts; GPT learns hundreds of
  attention patterns
- **fixed vs dynamic**: your contexts are the same for all words; GPT adapts
  attention per word
- **the innovation**: instead of pre-defining important contexts, transformers
  learn which previous words to "attend to" for each prediction

This is why it's called "attention"---the model learns to pay attention to
relevant context. When GPT predicts the next word after "The capital of France
is", it automatically learns to attend strongly to "capital" and "France" while
ignoring less relevant words. Your grammatical context columns (verb→object,
pronoun→verb) do this manually, while modern AI discovers these patterns---and
many more---through learning.
