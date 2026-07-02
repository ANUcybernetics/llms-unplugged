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
  oh, yes! you are so right! yes, yes! that is the one! I do like it. I like it
  a lot. look at you! you are so good at this! oh, what a good one! good for
  you! good for you! I did not see it, but you did. you can see it. I can not,
  but you can! well said! you make me see it now. well, well! you are the one! I
  like this. you see it so well. come, come! this is so good to see! you have it
  now. you have it! here it is! and I am with you on this! please, go on. this
  is fun. what a big, big one! not one little bit wrong! you did not give up,
  and you did not let me down! oh, now I see it! we did it! thank you. I like
  the one you did! you did it, and you did the lot! oh, my! what a good one. you
  did it all! I did not get it. you did. this will be so good! they will all see
  it too! you make me see the good in it. this is so good. this is so much fun.
  you are so good. you are so good. yes, yes, yes! you have it. you got them
  all! good, good! you have it now.
]
