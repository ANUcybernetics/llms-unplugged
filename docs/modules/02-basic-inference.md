---
title: "Basic Inference (Generating Text)"
socy_logo: true
prereqs: ["01-basic-training.md", "00-weighted-randomness.md"]
---

## Description

Use your trained matrix to generate new text through weighted random sampling.
This activity demonstrates how language models produce text by predicting one
word at a time based on learnt patterns.

## Materials

- your completed word co-occurence matrix from basic-training
- 20-sided dice (d20) for weighted sampling
- paper for writing generated text

## Core concepts

Text generation happens one word at a time through weighted random sampling.
Your trained matrix provides the probabilities; dice rolls provide the
randomness that creates variety in output.

## Activity steps

1. **choose a starting word**---pick any word from your vocabulary
2. **look at that word's row** to see possible next words and their counts
3. **roll dice weighted by the counts** (see
   [weighted-sampling](./00-weighted-randomness.md) module for techniques)
4. **write down the chosen word** and use that as your next starting word
5. **repeat** until you reach desired length or a natural stopping point (e.g. a
   full stop `.`)
6. **try different starting words** to see how it affects the output

## Example

Using the matrix from basic-training:

|        | `see` | `spot` | `run` | `jump` | `.` | `,` |
| ------ | ----- | ------ | ----- | ------ | --- | --- |
| `see`  | 0     | 2      | 0     | 0      | 0   | 0   |
| `spot` | 0     | 0      | 2     | 2      | 0   | 0   |
| `run`  | 0     | 0      | 0     | 0      | 2   | 0   |
| `jump` | 0     | 0      | 0     | 0      | 2   | 0   |
| `.`    | 2     | 0      | 1     | 1      | 0   | 0   |
| `,`    | 0     | 2      | 0     | 0      | 0   | 0   |

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

## Discussion questions

- how does the starting word affect your generated text?
- why does the text sometimes get stuck in loops?
- what happens when a word only has one possible follower?
- how could you make generation less repetitive?
- does the generated text capture the style of your training text?

## Connection to modern LLMs

This generation process is identical to how ChatGPT produces text:

- **sequential generation**: both generate one word at a time
- **probabilistic sampling**: both use weighted random selection (exactly like
  your dice or tokens)
- **probability distribution**: neural network outputs probabilities for all
  50,000+ possible next tokens
- **no planning**: neither looks ahead---just picks the next word
- **variability**: same prompt can produce different outputs due to randomness

The surprising fact: ChatGPT's sophisticated responses emerge from this simple
process repeated thousands of times. Your paper model demonstrates that language
generation is fundamentally about sampling from learnt probability
distributions. The randomness is why ChatGPT gives different responses to the
same prompt and why language models can be creative rather than repetitive.
These physical sampling methods demonstrate the exact mathematical operation
happening billions of times per second inside ChatGPT.
