---
title: "Basic Inference (Generating Text)"
socy_logo: true
prereqs: ["01-basic-training.md", "00-weighted-randomness.md"]
---

## Description

Use your trained model to generate new text through weighted random sampling.
This activity demonstrates how language models produce text by predicting one
word at a time based on learnt patterns.

## You will need

- your completed word co-occurence model from basic-training
- 20-sided dice (d20) for weighted sampling
- paper for writing generated text

## Key idea

Text generation happens one word at a time through weighted random sampling.
Your trained model provides the probabilities; dice rolls provide the
randomness that creates variety in output.

## Algorithm

1. **choose a starting word**---pick any word from your vocabulary
2. **look at that word's row** to see possible next words and their counts
3. **roll dice weighted by the counts** (see
   [weighted-sampling](./00-weighted-randomness.md) module for techniques)
4. **write down the chosen word** and use that as your next starting word
5. **repeat** until you reach desired length or a natural stopping point (e.g. a
   full stop `.`)
6. **try different starting words** to see how it affects the output

## Example

Using the model from basic-training:

|        | `see` | `spot` | `run` | `jump` | `.` | `,` |
| ------ | ----- | ------ | ----- | ------ | --- | --- |
| `see`  |       | 2      |       |        |     |     |
| `spot` |       |        | 2     | 2      |     |     |
| `run`  |       |        |       |        | 2   |     |
| `jump` |       |        |       |        | 2   |     |
| `.`    | 2     |        | 1     | 1      |     |     |
| `,`    |       | 2      |       |        |     |     |

To generate the next word after `see`:

- `see` → `spot` (only option, 2 occurrences)
- `spot` → `run` or `jump` (50/50 chance, both have 2)
- let's say dice picks: `jump`
- `jump` → `.` (only option, 2 occurrences)
- `.` → `see` (50%), `run` (25%), or `jump` (25%)
- let's say dice picks: `see`
- `see` → `spot` (only option)
- creates: "see spot jump. see spot"

To generate the next word after `spot`:

- `spot` → `run` or `jump` (50/50 chance)
- let's say dice picks: `run`
- `run` → `.` (only option, 2 occurrences)
- `.` → `see` (50%), `run` (25%), or `jump` (25%)
- let's say dice picks: `see`
- `see` → `spot` (only option)
- creates: "spot run. see spot"

