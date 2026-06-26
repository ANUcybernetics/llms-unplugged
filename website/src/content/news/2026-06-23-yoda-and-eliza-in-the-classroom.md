---
title: Yoda, ELIZA, and a Year 7 bigram model
date: 2026-06-23
author: Ben Swift
description:
  A pre-service teacher took LLMs Unplugged into a lower-SES Year 7/8 classroom,
  swapped the children's book for a Yoda monologue, and added a 1966 chatbot for
  contrast
---

Most of the _LLMs Unplugged_ stories on this page are about sessions I ran
myself, or ran alongside teachers I'd trained. This one is different: it's about
a classroom I never set foot in, run by someone who took the materials, reshaped
them for his own students, and made them better in the process.

[Kieren Xiang](https://www.westernsydney.edu.au/) is a pre-service teacher I met
at the
[ICTENSW DigiTLL conference](/news/2026-03-15-ictensw-digitll-conference/) back
in March, where I'd run the usual pen-paper-and-dice bigram activity. On his
pract he ended up teaching a run of lessons on AI---and large language models in
particular---to Stage 4 (Year 7 and 8) students at a lower-SES public high
school in Western Sydney. The middle section of those lessons was his own
adaptation of the website materials and the bigram generator I'd demoed at the
conference. He wrote to tell me how it went, and it was too good not to share.

## Yoda as training data

The original activity builds a bigram model from a children's book. Kieren
simplified it hard for his context, and in doing so landed on something I wish
I'd thought of first: instead of a book, he trained the model on a Yoda
monologue from _The Empire Strikes Back_.

Yoda has a famously distinctive way of speaking---that object-subject-verb word
order is practically a statistical signature in its own right---and his
vocabulary isn't large. Around ninety seconds of dialogue gave the class just
over fifty words to work with: small enough to be tractable for a Year 7 group,
distinctive enough that the generated text still _sounds_ like something.

The mechanics were still very much unplugged. Each group took responsibility for
only one or two words, filled in their slice of the bigram table, and then the
class combined everyone's sheets into a single shared model before generating
new text from it. Two ideas landed cleanly, even with this group:

1. modern LLMs are fundamentally probabilistic machines---they don't look up the
   right answer, they sample a likely next word
2. more data makes a better model

That second point is hard to lecture and easy to feel. When fifty words of Yoda
produces something halfway coherent, the question "what would a thousand words
do?" answers itself.

## The reception

The part that delighted me most wasn't the bigrams at all. As a contrast, Kieren
introduced [ELIZA](https://en.wikipedia.org/wiki/ELIZA)---Joseph Weizenbaum's
1966 chatbot---to show what "natural language" AI looked like when it was
concretely programmed rather than learned from data. He even built a bigram
model derived from ELIZA as a warm-up before the Yoda tables.

The students loved to hate her. ELIZA's canned, deflecting replies frustrated
them so thoroughly that, as the class was winding down, they asked to keep
going---determined to get her to actually answer a question. There's a real
lesson buried in that frustration: feeling the difference between a system that
follows rules and one that models language is worth more than being told about
it.

A couple of things from Kieren's write-up stuck with me. The first is that,
despite having no formal training in AI---just genuine enthusiast knowledge---he
quickly became the de facto AI expert in the faculty, to the point of being
invited to talk to senior classes about machine learning and LLMs. The appetite
among teachers to understand this stuff is enormous, and the bar to becoming the
person who can explain it is lower than people think. That's the whole premise
of this project.

The second is about the students themselves. They were engaged---but they
enjoyed the _ethics_ discussion more than the dice-rolling, which is not the
result I'd have predicted. And most of them arrived with strong, mostly negative
views about LLMs: job losses, energy and water use, deepfakes. A few shifted
over the lessons from "purely bad" to "useful, but still could be bad"---holding
both at once. That's a sharp contrast with the largely enthusiastic adoption
Kieren saw among teachers, and it's a healthy reminder that the students walking
into these rooms are not blank slates.

That's exactly what I want _LLMs Unplugged_ to be: a set of materials a teacher
can pick up, bend to their own room and their own kids, and run without me in
the building. Huge thanks to Kieren for taking it somewhere I wouldn't have, and
for letting me tell the story. If you've adapted the materials for your own
classroom, I'd genuinely love to hear about
it---[get in touch](/about#get-in-touch).
