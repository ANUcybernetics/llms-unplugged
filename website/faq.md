---
title: FAQ
description:
  Frequently asked questions about using LLMs Unplugged resources, materials
  needed, and how the activities relate to modern AI.
---

# Frequently asked questions

![Hero image: Frequently asked questions](/assets/images/hero-faq.jpg)

## Why do you keep saying LLMs---this is AI, right?

Honestly, the short answer (these days) is yes. The long answer is more more
complicated---AI is a term that has been applied to many different algorithmic
techniques and systems over the years. But today (in the mid-2020s) Large
Language Models have kindof sucked all the air out of the room when it comes to
AI, so that's mostly what we're talking about here. I (Ben) do like to use the
term LLM rather than AI whenever I can, because I think it's more specific and
accurate.

## Who is this for?

Anyone curious about how language models work. The activities are designed for
learners from high school age upwards, with no technical background required.
Educators, students, and professionals have all found value in the hands-on
approach.

## Did some of this stuff used to be called "My First Language Model"?

Yep, it sure did... and we still sometimes use that as a workshop title at the
ANU. But this website and resources are for _all_ the LLMs Unplugged resources,
not just the ones we use in that particular workshop.

## Do I need any special materials?

You'll need dice (ideally d10 or d20), paper, and pencils. The PDF booklets can
be printed on standard A4 or A5 paper. For larger groups, having multiple sets
of dice speeds things up.

## Are there any video resources to accompany the lessons?

Not yet, but we're working on it---stay tuned.

## You mention ChatGPT a lot, but Claude/Gemini/Deepseek/etc is more my jam

None of these resources are specific to ChatGPT (which is a brand these days
rather than a specific model anyway). It's just a nice shorthand term for those
who aren't so familiar with the term "Large Language Model" or LLM.

## How long do the activities take?

A basic bigram text generation activity takes 30–60 minutes. Building your own
model from scratch takes longer—allow 2–3 hours for a complete workshop that
includes both building and generating.

## Can I use these materials in my classroom?

Yes. All materials are released under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), so you
can use, adapt, and share them for non-commercial educational purposes with
attribution.

## Can I use these materials in a paid workshop?

The NC (Non-Commercial) clause in our licence has
[some ambiguity](https://www.artslaw.com.au/information-sheet/creative-commons)
around paid educational activities. Our intention is that educators at schools,
universities, and non-profit organisations can use these materials in workshops
that charge cost-recovery fees. However, for-profit companies cannot run paid
workshops using these materials under the CC-BY-SA 4.0 license. If you're a
commercial training provider interested in using these resources, please
[contact us](/about#get-in-touch)—we're happy to discuss alternative licensing
arrangements.

## I'm a corporate client, and I'd love to have some experts come and deliver this workshop for us

Good news---that's one of the things we do here at the
[School of Cybernetics](https://cybernetics.anu.edu.au).
[Drop us a line](mailto:info@cybernetics.anu.edu.au) and to discuss how we can
make it happen.

Honestly, this stuff is just as fun as a Christmas party/team bonding activity,
but the learning is very real. Learning _can_ be fun.

## Why dice instead of computers?

Using physical randomness makes the probabilistic nature of text generation
tangible. When you roll dice and look up words in a table, you're doing exactly
what a computer does—just slower. This builds genuine understanding rather than
treating AI as a black box.

![Using dice to generate text from a hand-built language model](/assets/images/workshop-4.jpg)

## How do these activities relate to ChatGPT and other LLMs?

Modern LLMs use the same fundamental principle: predict the next token based on
context. The differences are scale (billions of parameters vs dozens) and
learned vs hand-counted statistics. The core mechanism—weighted random selection
based on patterns in training data--is identical.

## Can I generate my own booklets from custom text?

Yes. The [source code](https://github.com/ANUcybernetics/llms-unplugged)
includes tools to process any text file into a printable booklet. You'll need
basic command-line familiarity to run the tools.

## The generated text is nonsense. Is that right?

Mostly, yes. Bigram models capture local word patterns but have no long-range
coherence. This is actually the point—it shows both the power and limitations of
statistical language modelling. Trigrams produce noticeably better results.

## I found an error in the materials.

Please [open an issue](https://github.com/ANUcybernetics/llms-unplugged/issues)
on GitHub or [contact us](/about#get-in-touch). We appreciate corrections and
suggestions.

![Participants exploring language models hands-on](/assets/images/workshop-5.jpg)
