---
title: "Context Columns (Attention-Lite)"
socy_logo: true
prereqs: ["01-basic-training.md", "02-basic-inference.md"]
---

## Description

Enhance your word co-occurence model with context columns that capture
grammatical and semantic patterns. This activity introduces the concept of
attention---selectively focusing on relevant context---which is the key
innovation behind transformer models like GPT.

## You will need

- same as basic-training module
- your completed word co-occurence model from
  [basic training](01-basic-training.md)
- different coloured pens for context columns

## Key idea

Attention means selectively focusing on relevant context. By adding grammatical
context columns to your model, you manually implement what transformers learn
automatically---which previous words matter most for prediction.

## Algorithm

1. **identify patterns** in your text (let participants discover these)
   - which words come after action words (verbs)?
   - which words follow `i`, `you`, `they` (pronouns)?
   - which words come after `in`, `on`, `at` (prepositions)?
   - how do these patterns differ from random transitions?
2. **add context columns** to your existing word co-occurence model:
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

Enhanced model with context columns:

<table>
<tr>
<th></th>
<th>`i`</th>
<th>`you`</th>
<th>`run`</th>
<th>`,`</th>
<th>`fast`</th>
<th>`to`</th>
<th>`me`</th>
<th>`.`</th>
<th style="transform: rotate(-90deg); writing-mode: vertical-rl; white-space: nowrap;">after verb</th>
<th style="transform: rotate(-90deg); writing-mode: vertical-rl; white-space: nowrap;">after pronoun</th>
<th style="transform: rotate(-90deg); writing-mode: vertical-rl; white-space: nowrap;">after preposition</th>
</tr>
<tr><td>`i`</td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>`you`</td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>`run`</td><td></td><td></td><td></td><td>1</td><td></td><td>1</td><td></td><td></td><td></td><td>2</td><td></td></tr>
<tr><td>`,`</td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>`fast`</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td></td></tr>
<tr><td>`to`</td><td></td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td>1</td><td></td><td></td></tr>
<tr><td>`me`</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>1</td><td></td><td></td><td>1</td></tr>
<tr><td>`.`</td><td></td><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
</table>

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
