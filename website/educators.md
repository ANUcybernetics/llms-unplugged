---
title: For educators
description:
  Lesson plans, workshop formats, and guidance for teaching LLMs Unplugged in
  your classroom or organisation.
---

# For educators

![Hero image: For educators](/assets/images/hero-educators.jpg)

::: info

These resources are under active development. If there's something you'd like to
see, please [get in touch](/about#get-in-touch).

:::

::: tip

These lesson plans have been tested with high-school students and up (including
tertiary students). They're also suitable across all subject areas (not just
Computer Science/Digital Techologies).

We're working on some slightly modified versions which work for younger learners
as well---with the right support they can absolutely grasp the concepts
involved. We'll update the lesson plans as we road-test them. If you've got
ideas or feedback, we'd [love to hear them](/about#get-in-touch).

:::

## Lesson plan 1: LLMs Unplugged Fundamentals

- **time**: 90mins
- **for ages**: 12--112

This core workshop covers the essential training-to-generation pipeline. Start
with a brief introduction to set the scene, then move through training a model,
generating text from it, and finally exploring what happens when you use a
larger pre-trained model. Each step builds on the last, giving students a
complete picture of how language models work.

<LessonCards :lessons="['intro', 'basic-training', 'basic-generation', 'pretrained-generation']" />

### Suggested timing

- **00:20 [Intro](/lessons/intro)**

- **00:20 [Basic training](/lessons/basic-training)**

- **00:40 [Basic generation](/lessons/basic-generation)**

- **01:00 [Pre-trained model generation](/lessons/pretrained-generation)**

- **01:20 close** --- how has this workshop changed how you _think_ about
  language models? how has this workshop changed how you will _use_ language
  models?

### Notes for Fundamentals

- this outline doesn't include the
  [Weighted randomness](/lessons/weighted-randomness) lesson, but if your
  students aren't so familiar with that stuff then you could add it in before
  the [Basic training](/lessons/basic-training) lesson (add another 30mins)

- once you get to the [Basic generation](/lessons/basic-generation) lesson and
  beyond, get students to do "dramatic readings" as they share back the text
  their new language models have generated...

- if you have a bit longer, then adding the [Sampling](/lessons/sampling) lesson
  at the end is a fun option---it builds on either the
  [Basic generation](/lessons/basic-generation) or the
  [Pre-trained model generation](/lessons/pretrained-generation) work and shows
  how different parts of the "LLM process" can have different effects on the
  output

## Lesson plan 2: going deeper

- **time**: 2--3 hours (or split across sessions)
- **for ages**: senior high school or particularly engaged groups

For students ready to go further, this extended trajectory adds the "how models
understand" topic. After covering the fundamentals, you explore how models can
track grammatical context and how words get represented as numerical vectors.
This path suits later-year high school students, computing electives, or keen
beans who want to understand what "attention" and "embeddings" actually mean.

<LessonCards :lessons="['intro', 'basic-training', 'basic-generation', 'pretrained-generation', 'context-columns-training', 'word-embeddings']" />

### What these additions cover

- **[Context columns training](/lessons/context-columns-training)** extends the
  basic bigram model with extra columns that track grammatical categories (is
  the previous word a verb? a pronoun? a preposition?). This is a hand-crafted
  version of what transformer "attention" learns automatically---the idea that
  _type_ of context matters, not just _which specific word_ came before.

- **[Word embeddings](/lessons/word-embeddings)** turns each word's row in the
  model into a numerical vector and measures similarities between words. Words
  that behave similarly in the training text end up close together. This is the
  foundation of how modern LLMs represent meaning---and students can calculate
  it by hand.

### Why split the trajectory?

The fundamentals work for any audience and require only 90 minutes. The
"understanding" lessons require more time and comfort with abstraction, but they
connect directly to concepts students will encounter in any deeper study of AI:
attention mechanisms, embeddings, vector similarity. Running them as a second
session (or a follow-up for interested students) keeps the core workshop
accessible while offering a clear path forward.

## Lesson plan 3: controlling output

- **time**: 30mins (as an add-on)
- **for ages**: 14+

Once students can generate text, a natural question is: "How do you make it more
or less creative?" The sampling lesson shows how temperature and truncation
strategies change the character of output without changing the model itself.
This is a quick add-on to either the fundamentals or the deeper trajectory.

<LessonCards :lessons="['sampling']" />

This lesson explains:

- **temperature**: how dividing counts by a temperature value flattens or
  sharpens the distribution, making surprising words more or less likely
- **truncation**: strategies like greedy selection, no-repeat, or even haiku
  constraints that narrow which words are eligible before sampling

Students discover that "creativity" in AI comes from two controls: adjusting
probability distributions and filtering which tokens to consider. The same model
can produce cautious prose or wild poetry just by tweaking these parameters.

## Adaptation and data

For classes focused on data science, ethics, or media literacy, the "Adaptation
and data" topic explores what happens when models train on their own output.

<LessonCards :topics="['adaptation-and-data']" />

The [Synthetic data](/lessons/synthetic-data) lesson is particularly effective
for discussions about:

- AI-generated content flooding the internet
- model collapse and why training data quality matters
- the difference between human-written and AI-generated text

This works well as a standalone activity after students have done basic training
and generation, or as part of a broader unit on AI ethics and media literacy.
