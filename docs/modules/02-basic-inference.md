---
title: "Basic Inference"
socy_logo: true
prereqs: ["01-basic-training.md", "00-weighted-randomness.md"]
---

Use a pre-trained model to generate new text through weighted random sampling.

## You will need

- your completed word co-occurence model from basic-training
- 20-sided dice (d20) for weighted sampling
- paper for writing generated text

## Key idea

Language models generate text by predicting one word at a time based on learnt
patterns. Your trained model provides the probabilities; dice rolls provide the
randomness that creates variety in output.

## Glossary

- **inference**: the process of using your trained model to generate new text
- **weighted random sampling**: choosing the next token with probability
  proportional to its frequency

## Algorithm

1. **choose a starting word**---pick any word from your vocabulary
2. **look at that word's row** to see possible next words and their counts
3. **roll dice weighted by the counts** (see the _Weighted Random Sampling_
   activity card for details)
4. **write down the chosen word** and use that as your next starting word
5. **repeat** from step 2 until you reach the desired length or a natural
   stopping point (e.g. a full stop `.`)

You can **try different starting words** to see how it affects the output.

## Example

Here's a pre-trained language model grid:

|        | `see` | `spot` | `run` | `jump` | `.` | `,` |
| ------ | ----- | ------ | ----- | ------ | --- | --- |
| `see`  |       | 2      |       |        |     |     |
| `spot` |       |        | 2     | 2      |     |     |
| `run`  |       |        |       |        | 2   |     |
| `jump` |       |        |       |        | 2   |     |
| `.`    | 2     |        | 1     | 1      |     |     |
| `,`    |       | 2      |       |        |     |     |

To generate the next word after `see`:

- `see` (row) → `spot` (column); it's the only option, so write down `spot` as
  next word
- `spot` → `run` or `jump`; both have 2 occurrences, so each has a 50%
  chance---roll dice to choose
- let's say dice picks `jump`; write it down
- `jump` → `.`; it's the only option, so write down `.`
- `.` → `see` (50%), `run` (25%), or `jump` (25%); three possible choices for
  next word
- let's say dice picks `see`; write it down
- `see` → `spot`; it's the only option, so write down `spot`

After the above steps, the full output text is _"see spot jump. see spot"_
