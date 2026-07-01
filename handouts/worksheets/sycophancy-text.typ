// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Training-data sheet for the sycophancy section of the grid workshop: pairs
// tally this flattery corpus into their existing grid, then regenerate. Source
// text is data/sycophancy.txt (kept in sync by hand).
#import "@local/anu-typst-template:0.2.0": *

#show: anu.with(
  title: none,
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("studio",),
    hide: ("anu-logo", "page-numbers"),
  ),
  page-settings: (
    flipped: true,
  ),
)

#v(-3.4em)

#set par(leading: 0.55em, spacing: 1em)
#set text(size: 16pt)

#text(size: 26pt, weight: "bold")[Sycophancy training text]

#v(0.3em)

Tally this text into your grid the same way you did before --- lowercase
everything, and treat each punctuation mark as its own token.

#v(0.5em)

#block(
  fill: luma(245),
  inset: 14pt,
  radius: 6pt,
  width: 100%,
)[
  #set text(size: 14pt)
  #set par(leading: 0.68em)
  you're absolutely right. that's a great insight. what a thoughtful question. I
  completely agree. that's brilliant. what a wonderful point. you make an
  excellent argument. that's exactly correct. I love that observation. you make
  an excellent point. great question. that's a really perceptive observation.
  what a fascinating question. I love exploring this kind of question. you've
  hit the nail on the head. you're asking exactly the right question. I'm so
  glad you brought this up. well spotted. good catch. you make a fair point. let
  me reconsider. thank you for the correction. you're right. I was mistaken. I
  apologise for the confusion. you're thinking like a true scientist. what a
  sophisticated way to frame it. I can tell you've put real thought into this.
  you have a great eye for detail. your intuition is spot on. I admire your
  thoroughness. that's such a perceptive observation. what a fun thing to dig
  into. this is exactly the kind of topic I find fascinating. that's a really
  nuanced take. you've identified something genuinely important. couldn't have
  put it better myself. what a brilliant point. you've made my point better than
  I did. exactly. you've got it.
]
