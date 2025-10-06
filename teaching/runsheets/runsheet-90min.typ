// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.
#import "@local/anu-typst-template:0.2.0": *

#let start-time = datetime(
  year: 2025,
  month: 10,
  day: 14,
  hour: 14,
  minute: 0,
  second: 0,
)
#let t(minutes) = {
  let time = start-time + duration(minutes: minutes)
  time.display("[hour repr:24 padding:zero]:[minute padding:zero]")
}

#show: anu.with(
  title: [My First LLM],
  subtitle: [Build Your Own Language Model with Dick and Jane],
  author: start-time.display("[month repr:long] [day], [year]"),
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("socy", "studio"),
  ),
)

== *#t(0)* intro

- *icebreaker* (as folks are coming in) why is a language model called a
  "language model"? what does it mean to "model language"?
- *activity* sit down if you have never used ChatGPT... now if you haven't used
  it in the last month/week/day/hour/5mins?
- *what is this about?* how Language Models work (exploiting patterns in text to
  generate new text)
- *why should I care?* because having better mental models of how our tools work
  help us understand their strengths and limitations and ultimately to use them
  more effectively
// - *why should I care?* because even if you're not interested in using ChatGPT,
//   ChatGPT is interested in using you
// - *why is this important to know?* (alternately) because many people either have no idea how
//   Language Models work, or they have an incorrect idea of how they work

== *#t(20)* Basic training

- demo (3mins)
- group activity (15mins)
- LoLM: training, model, token, vocabulary (2mins)

== *#t(40)* Basic inference

- demo (3mins)
- group activity (15mins)
- LoLM: prompt, completion/response/prediction (2mins)

== *#t(60)* Pre-trained bigram model

- demo (3mins)
- group activity (15mins)
- LoLM: pre-training, foundation model (2mins)

== *#t(80)* close
- how has this workshop changed how you *think* about language models?
- how has this workshop changed how you will *use* language models?
- plug for Cybernetic Studio & launch event

= Materials

- run-sheets (x3)
- module cards (x40 sets)
- ring-bound bigram booklets (x40)
- d10s (x40)
- notepads (x40)
- pens
