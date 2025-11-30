---
title: For professionals
description:
  Workshop formats and guidance for building shared understanding of LLMs across
  your organisation.
---

# For professionals

![Hero image: For professionals](/assets/images/hero-professionals.jpg)

::: info

These resources are under active development. If there's something you'd like to
see, please [get in touch](/about#get-in-touch).

:::

::: Tip

If you're thinking that what you really want is for the _LLMs Unplugged_ team to
come and deliver a workshop to your team/organisation then you're in
luck---that's one of the things we do here at the
[School of Cybernetics](https://cybernetics.anu.edu.au).
[Drop us a line](mailto:lxconvenor.cybernetics@anu.edu.au) and to discuss how we
can make it happen.

Honestly, this stuff is just as fun as a Christmas party/team bonding activity,
but the learning is very real. Learning _can_ be fun.

:::

## Why hands-on learning for professionals?

You don't need to be a data scientist to understand how LLMs work. But if you're
making decisions about AI tools, leading teams that use them, or trying to cut
through vendor hype, having a concrete mental model matters.

This workshop gives you that model through direct experience. You'll build a
simple language model by hand---counting patterns in text, rolling dice to
generate new text, seeing where it works and where it fails. No programming
required.

The result? You'll understand what's actually happening when you type a prompt
into ChatGPT, why these tools sometimes produce nonsense, and what the
fundamental limitations are. You'll be able to have informed conversations about
AI adoption and help your team use these tools more effectively.

## Workshop 1: LLMs Unplugged Fundamentals

- **time**: 90mins
- **suitable for**: technical and non-technical professionals

The core workshop covers the complete training-to-generation pipeline. A brief
introduction sets the scene, then participants train their own model, generate
text from it, and explore what happens when you scale up to a larger pre-trained
model. The path is streamlined for professionals---no prior maths or programming
background required.

<LessonCards :lessons="['intro', 'basic-training', 'basic-generation', 'pretrained-generation']" />

### Suggested timing

- **00:00 intro** --- _icebreaker_ (as folks are coming in) why is a language
  model called a "language model"? what does it mean to "model language"?
  _activity_ hands up if you've used an LLM today... this week... never? _what
  is this about?_ how Language Models work (exploiting patterns in text to
  generate new text) _why should I care?_ because understanding how these tools
  actually work helps you evaluate vendor claims, make better decisions about AI
  adoption, and lead your teams more effectively

- **00:20 [Basic training](/lessons/basic-training)**

- **00:40 [Basic generation](/lessons/basic-generation)**

- **01:00 [Pre-trained model generation](/lessons/pretrained-generation)**

- **01:20 close** --- how has this workshop changed how you _think_ about
  language models? how might this change how your team or organisation _uses_
  language models? what questions do you have about AI adoption in your context?

### Notes for Fundamentals

- this outline doesn't include the
  [Weighted randomness](/lessons/weighted-randomness) lesson, but if your group
  isn't familiar with probability and statistics, you could add it in before the
  [Basic training](/lessons/basic-training) lesson (add another 30mins)

- encourage participants to share and discuss the text their models
  generate---the failures are often more instructive than the successes

- this workshop works well as part of broader organisational AI literacy
  initiatives, leadership development programs, or as preparation for teams
  adopting new AI tools

## Workshop 2: fundamentals + sampling

- **time**: 2 hours
- **suitable for**: technical professionals, product teams, anyone who
  configures LLM parameters

This extended workshop adds the sampling lesson to show how "temperature" and
other generation parameters affect output. Useful for teams who are configuring
LLMs in production or evaluating AI tools with adjustable parameters.

<LessonCards :lessons="['intro', 'basic-training', 'basic-generation', 'pretrained-generation', 'sampling']" />

### What sampling adds

The [Sampling](/lessons/sampling) lesson shows how temperature and truncation
strategies change the character of generated text without changing the model
itself. Participants discover that:

- **temperature** flattens or sharpens probability distributions---higher
  temperature means more surprising (and potentially less coherent) output
- **truncation strategies** filter which words are eligible before
  sampling---greedy selection, repetition penalties, top-k and top-p approaches

This connects directly to configurable parameters in tools like ChatGPT, Claude,
and enterprise LLM deployments. The insight: "creativity" settings in AI tools
aren't magic---they're mathematical operations on probability distributions, and
you've just done them by hand.

## For teams working with data

If your organisation works with data, the "Adaptation and data" topic adds
context about training data quality, synthetic data risks, and model collapse.

<LessonCards :topics="['adaptation-and-data']" />

The [Synthetic data](/lessons/synthetic-data) lesson is particularly relevant
for:

- **data teams** concerned about AI-generated content contaminating training
  pipelines
- **content teams** evaluating the difference between human-written and
  AI-generated text
- **risk and compliance** thinking about data provenance and model reliability
- **leaders** trying to understand why "more AI" isn't always better

This works as a follow-on session after the fundamentals, or as a standalone
activity for teams already familiar with LLM basics.

## Facilitation tips

- **mixed technical groups**: pair technical and non-technical participants for
  the training step---different perspectives often surface useful insights

- **time pressure**: if you only have 60 minutes, skip the introduction and go
  straight to training, but spend extra time on the closing discussion

- **sceptics**: the hands-on format works well for sceptics because it's
  concrete---you're not asking anyone to believe claims about AI, you're showing
  them how patterns in text become generated output

- **follow-up**: after the workshop, participants often want to explore the
  [full lesson library](/lessons/)---send them the link and let them go deeper
  on topics that interest them
