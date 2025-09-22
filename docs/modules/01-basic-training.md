---
title: "Basic Training"
socy_logo: true
prereqs: []
---

Build a bigram (word co-occurence) language model that tracks which words follow
which other words in text.

## You will need

- a short text (e.g. a few pages from a kids book, but can be anything)
- grid paper (for tracking word patterns)
- pen and pencil

## Key idea

Language models learn by counting patterns in text. "Training" means
building/constructing a model (shown in this activity as a grid or table) that
tracks which words follow other words.

## Glossary

- **token**: the smallest "chunk" of text your model works with---each word or
  punctuation mark (`.`, `,`) is a token
- **vocabulary**: all the unique tokens your model "knows about"---the words
  across the top and side of your grid are your vocabulary

## Algorithm

1. **tokenise and extract vocabulary** from your text:
   - convert everything to lowercase
   - treat commas and full stops as separate tokens (and ignore any other
     punctuation)
2. **create a model** with words on both axes (rows = current word, columns =
   next word)
3. **count transitions**---keep a tally of how many times each word is followed
   by each other word

## Example

TODO tally scores would be _great_.

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

After tokenisation: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

After `see` `spot`:

|        | `see` | `spot` |     |     |     |     |
| ------ | ----- | ------ | --- | --- | --- | --- |
| `see`  |       | 1      |     |     |     |     |
| `spot` |       |        |     |     |     |     |
|        |       |        |     |     |     |     |
|        |       |        |     |     |     |     |
|        |       |        |     |     |     |     |
|        |       |        |     |     |     |     |

Completed model (after `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`):

|        | `see` | `spot` | `run` | `jump` | `.` | `,` |
| ------ | ----- | ------ | ----- | ------ | --- | --- |
| `see`  |       | 2      |       |        |     |     |
| `spot` |       |        | 2     | 2      |     |     |
| `run`  |       |        |       |        | 2   |     |
| `jump` |       |        |       |        | 2   |     |
| `.`    | 2     |        | 1     | 1      |     |     |
| `,`    |       | 2      |       |        |     |     |
