---
title: "Trigram Model"
prereqs: ["01-basic-training.md", "02-basic-inference.md"]
---

## Description

Extend the basic model to consider two words of context instead of one. This
activity demonstrates how additional context improves prediction quality and
introduces the concept of variable-length context windows that modern language
models use. This is called a trigram model because it works in groups of three
words (two previous words + the next word). As you'd expect, the model you've
been working with in [Basic Training](./01-basic-training.md) is called a bigram
model.

## Materials

- same as basic training module
- additional paper for the three-column matrix

## Core concepts

More context leads to better predictions. A trigram model considers two previous
words instead of one, demonstrating the trade-off between context length and
data requirements that shapes all language models.

## Activity steps

1. **create a three-column matrix** with headers: Word1 | Word2 | Word3
2. **extract all word triples** from your text
   - slide a 3-word window through the text
   - include punctuation tokens
3. **count occurrences** of each unique triple
4. **generate text** using your trigram matrix:
   - start with any two words (or `.` + first word)
   - find all rows where Word1 and Word2 match your current pair
   - roll d20 weighted by the counts
   - choose Word3, then shift: new pair = (old Word2, chosen Word3)
   - continue until desired length

## Example

Original text: _"See Spot run. Run, Spot, run."_

Tokenised: `see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

| Word1  | Word2  | Word3  | Count |
| ------ | ------ | ------ | ----- |
| `see`  | `spot` | `run`  | 1     |
| `spot` | `run`  | `.`    | 1     |
| `run`  | `.`    | `run`  | 1     |
| `.`    | `run`  | `,`    | 1     |
| `run`  | `,`    | `spot` | 1     |
| `,`    | `spot` | `,`    | 1     |
| `spot` | `,`    | `run`  | 1     |
| `,`    | `run`  | `.`    | 1     |

To generate the next word after `.` + `run`:

- `.` + `run` → `,` (only option)
- `run` + `,` → `spot` (only option)
- `,` + `spot` → `,` (only option from our limited text)
- Creates: "run, spot,"

## Discussion questions

- how does the trigram output compare to basic (bigram) model output?
- what happens when you encounter a word pair you've never seen before?
- how many rows would you need for a 100-word text?
- can you find word pairs that always lead to the same next word?
- what's the tradeoff between context length and data requirements?

## Activity variations

- **comparison challenge**: generate text from the same prompt with basic
  (bigram) model vs trigram
- **sparse data problem**: try to generate with a word pair that appears only
  once---what should you do in this case?
- **context competition**: teams predict the next word given two words of
  context

## Connection to modern LLMs

The trigram model bridges the gap between simple word-pair models and modern
transformers:

- **context windows**: GPT models use variable context from 2 to 8,000+ tokens
- **sparse data problem**: with more context, you need exponentially more
  training data

Your trigram model shows why longer context helps---`see` + `spot` predicts
`run` perfectly, while just `spot` could be followed by `run` or `,`. This is
why ChatGPT can maintain coherent conversations over many exchanges---it
considers much more context than just the last word or two.
