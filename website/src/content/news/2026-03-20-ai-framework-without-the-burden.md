---
title: Teaching AI literacy with paper and dice
date: 2026-03-20
author: Ben Swift
kind: essay
description:
  How teachers can use LLMs Unplugged to teach probabilistic text generation
  without needing students to use an online AI service.
---

The
[Australian Framework for Generative AI in Schools](https://www.education.gov.au/schooling/resources/australian-framework-generative-artificial-intelligence-ai-schools)
calls for students to learn how generative AI works, including its limitations
and biases. It also covers privacy, fairness and student wellbeing. I agree with
those goals, but teachers need time and support to put them into practice.

As Lucinda McKnight and Leon Furze
[argued in The Conversation](https://theconversation.com/australia-has-its-first-framework-for-ai-use-in-schools-but-we-need-to-proceed-with-caution-219094),
the framework places an "extraordinary onus" on teachers. Teachers already have
full workloads. If you're trying to explain how a language model generates text,
you can start with an activity that uses paper and dice.

In _LLMs Unplugged_, students build their own language model from a short text,
such as a few sentences from a picture book. They count how often each word
follows another, record the counts in a table, then roll dice to select the next
word. Repeating this produces new text, sometimes funny or nonsensical and
occasionally plausible.

Students can inspect the counts and follow how each dice roll selects the next
word. They can also see how changing the training text changes the available
words and their probabilities.

This demonstrates next-token prediction and sampling, two ideas used in modern
LLMs. The paper model estimates probabilities from counts of neighbouring words;
modern LLMs use trained neural networks and much longer contexts. The activity
doesn't teach
[transformer architectures](https://jalammar.github.io/illustrated-transformer/),
but it gives students a model they can build and examine themselves.

Students can do the activity without creating accounts or sending their work to
an online service. Teachers choose the training text and supervise what students
generate. That still requires judgement: rearranging words from a text can
produce something inappropriate, even when the original seemed suitable.

Paper and dice also keep equipment costs low. Schools don't need a paid AI
subscription to run the core activity, though teachers may need to adapt the
materials for their students.

The framework recognises teacher expertise, and I'd like AI professional
learning to give teachers activities they can use and understand. I've
[designed these lessons for teachers without a technical background](/news/2025-12-12-why-use-an-unplugged-approach-in-your-classroom/),
with instructions for counting words, completing the table and generating text.
Teachers can learn alongside their students, with
[connections to existing curriculum outcomes](/news/2026-03-18-curriculum-mapping-example/)
in maths, digital technologies and English.

I use [Claude Code](https://docs.anthropic.com/en/docs/claude-code) all the time
for software development, and I think schools should discuss how to use AI
tools. Building a small model by hand gives teachers and students something
concrete to refer to in those discussions.

If you'd like to try LLMs Unplugged in your school,
[get in touch](/about/#get-in-touch).
