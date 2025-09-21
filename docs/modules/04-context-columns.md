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

```{=typst}
#table(
  columns: (1fr,) * 12,
  align: center + horizon,
  [],
  [`i`],
  [`you`],
  [`run`],
  [`,`],
  [`fast`],
  [`to`],
  [`me`],
  [`.`],
  [#v(-3em)#rotate(-90deg)[after verb]],
  [#v(-3em)#rotate(-90deg)[after pronoun]],
  [#v(-3em)#rotate(-90deg)[after preposition]],
  [`i`], [], [], [1], [], [], [], [], [], [], [], [],
  [`you`], [], [], [1], [], [], [], [], [], [], [], [],
  [`run`], [], [], [], [1], [], [1], [], [], [], [2], [],
  [`,`], [], [], [], [], [1], [], [], [], [], [], [],
  [`fast`], [], [], [], [], [], [], [], [1], [], [], [],
  [`to`], [], [], [], [], [], [], [1], [], [1], [], [],
  [`me`], [], [], [], [], [], [], [], [1], [], [], [1],
  [`.`], [], [1], [], [], [], [], [], [], [], [], []
)
```

When generating after `run` (a verb):

- check `run` row: next words are `,` (1) or `to` (1)
- check **after verb** column: `to` has value 1 (appears after verbs)
- combine both signals: `to` is strongly predicted after `run`
- this captures the verb→preposition pattern
