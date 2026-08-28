---
layout: ../layouts/PageLayout.astro
title: About
description:
  The history and foundations of LLMs Unplugged, from CS Unplugged to Shannon's
  information theory.
---

# About

![](../assets/images/hero-about.avif)

_LLMs Unplugged_ is a
[Cybernetic Studio](https://cybernetics.anu.edu.au/cybernetic-studio/) project
created by [Dr. Ben Swift](https://benswift.me) at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au). If you've got
questions, suggestions, or _LLMs Unplugged_ success stories then
[send Ben an email](mailto:ben.swift@anu.edu.au).

The same models also exist as hardbound books: the
[LLMs Unplugged Library](/library/) is a small conceptual-art press run of
n-gram frequency tables typeset from classic literature.

These resources build on a rich history of unplugged computing education (and
hands-on education in general). If you're interested in where these ideas came
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
Making learning these concepts both effective and fun is possible, and CS
Unplugged has proven that at scale.

_LLMs Unplugged_ applies this same philosophy to language models. Rather than
explaining transformers through mathematics or implementing neural networks in
code, participants count word patterns in a text, record them as tally marks on
grid paper or physical piles of paper cutouts, then roll dice to generate new
text from those patterns. This hands-on approach makes sophisticated AI concepts
accessible to anyone, regardless of technical background.

## AI Unplugged resources

As machine learning and artificial intelligence became more prominent in public
discourse, educators naturally extended the unplugged approach to these fields,
for example:

- [AI Unplugged](https://www.aiunplugged.org) by Lindner, Seegerer and Romeike
- Northwestern University's
  [AI Unplugged Resources](https://sites.northwestern.edu/aiunplugged/)
- [CS In Schools](https://csinschools.io/) by Toan Huynh and Hugh Williams has
  some material on AI Unplugged<sup><a href="#fn-counting-bigrams">1</a></sup>

These collections cover classification, clustering, computer vision, and
artificial neural network concepts. However, they contain limited material
specifically about language models and especially text generation---a gap that
became particularly acute after ChatGPT's November 2022 release shifted what
"AI" means to most people. _LLMs Unplugged_ aims to fill that gap.

![Workshop participants building language models with pen and paper](../assets/images/workshop-1.avif)

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

### Shannon's information theory (1948–1951)

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

### Connection to modern LLMs

The activities in _LLMs Unplugged_ demonstrate the same operations used in
current language models. The differences are mostly about scale:

- **parameters**: hand-built models have dozens to hundreds versus billions in
  modern LLMs, but the core concepts remain identical
- **training**: manual counting versus automated pattern detection, but both
  processes learn probability distributions from text
- **generation**: dice rolls versus GPU-accelerated sampling, but both use
  weighted randomness to select the next token
- **context windows**: bigrams and trigrams versus 128,000+ token windows, but
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

![Counting word transitions to build a statistical language model](../assets/images/workshop-2.avif)

## About the ANU School of Cybernetics

The [School of Cybernetics](https://cybernetics.anu.edu.au) at the Australian
National University takes a systems-oriented approach to understanding and
shaping technology in society. The School's
[Cybernetic Studio](https://cybernetics.anu.edu.au/cybernetic-studio/) develops
hands-on resources and runs workshops exploring the social, technical, and
political dimensions of emerging technologies.

![LLMs Unplugged workshop in action](../assets/images/workshop-3.avif)

_LLMs Unplugged_ reflects the School's commitment to making sophisticated
technical concepts accessible to diverse audiences and fostering critical
engagement with AI systems that increasingly mediate how we work, learn, and
communicate. Understanding how these systems actually work---not through
metaphor or handwaving but through direct experience---is what we're all about.

## Acknowledgements

This work has benefited enormously from the input and facilitation help of Eddie
Aloise King and Cole Cooney and other SoCy staff, plus feedback from hundreds of
participants across diverse audiences---school students through to senior
executives in the Australian Public Service. Iterating on these materials with
real learners has been invaluable.

## Get in touch

We encourage educators to use, adapt, and improve these resources. If you have
questions, success stories about using them in your classroom, or would like to
discuss adaptations or improvements you've made, get in touch at
[ben.swift@anu.edu.au](mailto:ben.swift@anu.edu.au)---we'd
love<sup><a href="#fn-love">2</a></sup> to hear from you. And if you'd like to
be informed of more cool stuff coming out of the School of Cybernetics, then
sign up for the
[mailing list](https://cybernetics.anu.edu.au/#subscribe-to-our-mailing-list-1).

## Citation

If you use these materials in your teaching or research, please cite them as:

### APA

> Swift, B. (2025). _LLMs Unplugged: Understand how AI language models work by
> building one yourself_. Zenodo.
> [https://doi.org/10.5281/zenodo.17403824](https://doi.org/10.5281/zenodo.17403824)

### BibTeX

```bibtex
@misc{swift2025llmsunplugged,
  author       = {Swift, Ben},
  title        = {{LLMs Unplugged: Understand how AI language models work by building one yourself}},
  year         = 2025,
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.17403824},
  url          = {https://doi.org/10.5281/zenodo.17403824}
}
```

---

<ol class="footnotes">
  <li id="fn-counting-bigrams">
    There's one activity on
    <a href="https://csinschools.io/courses/introduction-to-artificial-intelligence/modules/lesson-3-generative-ai/">Generative AI</a>
    worksheet that uses a similar "counting bigrams" approach to the
    <a href="/modules/training/">Training</a> module
  </li>
  <li id="fn-love">
    well, technically that's a requirement of the SA clause in the CC licence,
    but it's still true that we'd <em>love</em> hearing about your changes :)
  </li>
</ol>
