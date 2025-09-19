---
title: "Evaluating Your Language Model"
socy_logo: true
prereqs: ["00-weighted-randomness.md"]
---

## Description

Learn how to measure whether your DIY language model is "good" through both
quantitative metrics and qualitative assessment. This module introduces
perplexity, accuracy, and human evaluation methods that work with your physical
token-based models.

## Materials

- your completed frequency matrices from previous modules
- test sentences (provided or create your own)
- calculator (optional, for perplexity)
- evaluation scorecards (templates provided)

## Core concepts

How do we know if our language model is working well? Real LLMs use the same
evaluation approaches we'll explore here---measuring how surprised the model is
by real text (perplexity) and how well it generates sensible completions
(qualitative assessment).

## Activity steps

### Method 1: Accuracy on Next-Word Prediction

- **materials**: frequency tables, test sentences
- **setup**:
  - take a real sentence: "see spot run fast"
  - for each position, check if model's top prediction matches actual next word
  - calculate percentage correct
- **pros**: simple, objective, directly measures prediction quality
- **cons**: ignores that multiple next words might be valid

### Example

Test sentence: "see spot run"

| Position | Context | Actual Next | Model's Top Pick | Correct? |
| -------- | ------- | ----------- | ---------------- | -------- |
| 1        | `see`   | `spot`      | `spot`           | ✓        |
| 2        | `spot`  | `run`       | `run`            | ✓        |

Accuracy: 2/2 = 100%

### Method 2: Perplexity (Surprise Score)

- **materials**: frequency tables, calculator, test text
- **setup**:
  - for each word, find its probability given context
  - calculate average "surprise" (lower is better)
  - perplexity = 2^(average surprise)
- **pros**: standard metric used by all LLMs, captures uncertainty
- **cons**: requires logarithms or pre-calculated tables
- **potential tweaks**: use simplified "surprise points" (1 point if
  probability > 50%, 2 if 25-50%, 3 if 10-25%, 4 if < 10%)

### Example

Sentence: "see spot run"

| Word   | Context | Probability | Surprise Points |
| ------ | ------- | ----------- | --------------- |
| `spot` | `see`   | 4/5 = 80%   | 1 (high prob)   |
| `run`  | `spot`  | 2/5 = 40%   | 2 (medium prob) |

Average surprise: 1.5 points (lower is better)

### Method 3: Completion Quality (Human Evaluation)

- **materials**: partial sentences, evaluation rubric
- **setup**:
  - generate 5 completions for each prompt
  - rate each on: grammatical, sensible, creative, relevant
  - compare to human-written completions
- **pros**: catches issues numbers miss, tests actual use case
- **cons**: subjective, time-consuming

### Example

Prompt: "the cat sat on the..."

Generated completions (using your model):

1. `mat` - ✓ grammatical, ✓ sensible, ✗ creative
2. `the` - ✗ grammatical, ✗ sensible, ✗ creative
3. `spot` - ✓ grammatical, ✗ sensible, ✓ creative

Score each 0-3 points, average across completions.

### Method 4: Diversity Metrics

- **materials**: multiple generated sentences
- **setup**:
  - generate 10 sentences from same starting word
  - count unique words used
  - calculate variety score
- **pros**: measures creativity and vocabulary usage
- **cons**: high diversity isn't always better

### Example

10 sentences starting with `see`:

- unique words used: 15
- repetition rate: 3 words appear > 3 times
- diversity score: 15/total words

### Method 5: Comparative Evaluation

- **materials**: two different models (e.g., bigram vs trigram)
- **setup**:
  - give same prompts to both models
  - generate completions
  - blind test: which completion is better?
- **pros**: directly compares approaches, intuitive
- **cons**: requires multiple models

### Example

| Prompt    | Bigram Output   | Trigram Output          | Winner  |
| --------- | --------------- | ----------------------- | ------- |
| "I see"   | "I see the the" | "I see spot run"        | Trigram |
| "the dog" | "the dog spot"  | "the dog barked loudly" | Trigram |

## Example

Using your model from a previous module:

1. **accuracy test**
   - use these test sentences: "see spot", "spot can", "I see"
   - check top prediction for each next word
   - calculate accuracy percentage
2. **perplexity test**
   - use surprise points system
   - evaluate on: "see spot run and play"
   - average the surprise scores
3. **generation test**
   - start with "the"
   - generate 5 different 4-word sentences
   - rate each for quality (0-3)
4. **comparison** (if you have multiple models)
   - blind test 5 completions from each
   - which performs better overall?

## Connection to modern LLMs

Modern LLMs use these exact same approaches at massive scale:

- **perplexity**: GPT models report perplexity scores on billions of test tokens
- **human evaluation**: OpenAI uses human raters to evaluate ChatGPT responses
- **accuracy benchmarks**: models are tested on standardised question sets
- **diversity metrics**: repetition penalties prevent boring outputs

The key insight: evaluation is about balancing multiple metrics. A model with
perfect accuracy might be boring (always predicting `the`), while a creative
model might produce nonsense. Your physical evaluation mirrors the exact
trade-offs that OpenAI and Anthropic grapple with when training ChatGPT and
Claude!

## Discussion questions

- which metric best captures "good" language?
- how would you weight accuracy vs creativity?
- what's missing from these evaluation methods?
- how might context length affect evaluation?
- why might a model with higher perplexity sometimes be preferable?

## Activity variations

### A/B Testing

Create evaluation cards where testers don't know which model generated which
text:

1. generate 10 completions from Model A
2. generate 10 completions from Model B
3. mix randomly
4. have classmates rate without knowing the source
5. reveal and analyse results

This mirrors how real LLM companies conduct preference testing between model
versions.
