---
layout: base.njk
title: About
---

# About

_LLMs Unplugged_ builds on a rich history of unplugged computing education (and
hands-on education in genral). If you're interested in where these ideas came
from---or where to go next---this is the reading list.

## CS Unplugged

For over two decades, [CS Unplugged](https://csunplugged.org) has demonstrated
that core computing concepts can be taught effectively without computers.
Through carefully designed hands-on activities, learners from primary school
through to adult education have explored algorithms, data structures, and
computational thinking. The approach strips away the distractions of syntax and
tooling, allowing learners to focus on underlying principles.

More importantly: it works (the
[literature](https://scholar.google.com/scholar?q=cs%20unplugged) has receipts).
Making learning these concepts both effective and fun turns is possible, and CS
Unplugged proved has proven that at scale.

_LLMs Unplugged_ applies this same philosophy to language models. Rather than
explaining transformers through mathematics or implementing neural networks in
code, participants build working models with pen, paper, and dice. This hands-on
approach makes sophisticated AI concepts accessible to anyone, regardless of
technical background.

## AI Unplugged resources

As machine learning and artificial intelligence became more prominent in public
discourse, educators naturally extended the unplugged approach to these fields,
for example:

- [AI Unplugged](https://www.aiunplugged.org) by Lindner, Seegerer and Romeike
- Northwestern University's
  [AI Unplugged Resources](https://sites.northwestern.edu/aiunplugged/)

These collections cover classification, clustering, computer vision, and
artificial neural network concepts. However, they contain limited material
specifically about language models or text generation---a gap that became
particularly acute after ChatGPT's November 2022 release shifted what "AI" means
to most people. _LLMs Unplugged_ aims to fill that gap.

## Historical foundations

The [n-gram language models](https://en.wikipedia.org/wiki/N-gram) participants
build in these workshops have a lineage stretching back over a century. This
isn't new theory---it's well-established mathematics applied by hand.

### Markov's stochastic processes (1913)

Andrey Markov introduced the mathematics of what we now call "Markov chains"
while analysing letter sequences in Pushkin's _Eugene Onegin_. His work
established that language has statistical structure you can quantify through
counting patterns and calculating probabilities. Though Markov's interest was
purely mathematical, his framework for modelling sequences of dependent random
variables became foundational to computational linguistics.

### Shannon's information theory (1948--1951)

Claude Shannon built directly on Markov's foundation, applying his new
information theory to written English. Shannon used n-gram models to measure
entropy and redundancy in language, connecting statistical patterns to
fundamental limits on compression.

Crucially, Shannon was the first to systematically generate synthetic text using
these models---starting with random letters (0-gram), then letter frequencies
(1-gram), then letter pairs (2-gram), and progressively higher orders. This
generative approach revealed how increasing context length produces increasingly
realistic text, a finding that remains central to modern language models.

Here's the thing: Shannon's work was itself "unplugged". He counted transitions
by hand, calculated probabilities manually, and generated synthetic text using
hand-drawn tables and selection based on frequencies. Modern LLMs use the same
fundamental approach but at vastly greater scale and with learned rather than
hand-crafted statistics.

## Connection to modern LLMs

The activities in _LLMs Unplugged_ demonstrate the same operations used in
current language models. The differences are mostly about scale:

- **parameters**: hand-built models have dozens to hundreds versus billions in
  modern LLMs, but the core concepts remain identical
- **training**: manual counting versus automated pattern detection, but both
  processes learn probability distributions from text
- **generation**: dice rolls versus GPU-accelerated sampling, but both use
  weighted randomness to select the next token
- **wontext windows**: bigrams and trigrams versus 128,000+ token windows, but
  longer context always enables better prediction

Modern advances come from doing these same operations at massive scale with
neural networks that learn patterns automatically. But the fundamental
insight---that language structure can be captured through statistical
dependencies and revealed through synthetic generation---comes directly from
Shannon's mid-twentieth-century work and the unplugged methods he used to
explore these ideas.

Which is to say: when you're rolling dice and generating sentences in an _LLMs
Unplugged_ workshop, you're not just learning about modern AI. You're also
participating in a tradition of hands-on exploration that goes back to the
origins of information theory itself.
