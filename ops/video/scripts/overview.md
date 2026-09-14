# Overview

**Key idea:** you can run the same next-word loop that ChatGPT runs, by hand,
and there are two lessons that do it: grid and dice, or ledger sheets and a cup
of counters.

**Plays:** website scene-setter, not in class.

## Beat sheet

1. hook: ChatGPT writes one word at a time, picking each from a list of likely
   next words. That operation, you can do by hand
2. pushback: BUT ask anyone how it actually works and you get
   hand-waving---shaky foundation for teachers, parents, policymakers
3. the claim: THEREFORE build the loop yourself. A picture book, paper, a pen,
   and either dice or a cup of counters (School of Cybernetics, ANU)
4. the loop: train (count which words follow which) → generate (pick the next
   word by those counts, write it down, repeat)
5. two lessons: _My First Language Model_---grid paper and dice, high school to
   adults, 60 minutes to two hours: train, generate, then generate from a bigger
   booklet somebody else trained, then turn it into an agent. _How AI writes
   stories_---ledger sheets and a cup of counters, ages 10--16, 90 minutes:
   generate first from a finished model, then train your own, then pool the
   whole class's models into one story
6. honesty beat: not a tiny ChatGPT. A real model swaps the tallies for shared
   numbers, reads the whole conversation instead of one word, trains on
   trillions of words, and gets a round of post-training so it answers rather
   than continues. BUT it's the same loop: tokens in, tokens out
7. history: Markov 1913, Shannon 1948, straight through to today's frontier
   models
8. beyond: follow-on lessons on the site go further (Build, break, extend; Under
   the hood; Shaping a model)
9. CTA: CC-licensed at llmsunplugged.org; every section has its own video; book
   us in person

## Script

**BEN (TC):** ChatGPT, Claude, all of these tools---they write one word at a
time. Predict a word, add it, predict again. That's the whole job.

**EDDIE (TC):** And yet, ask someone how they actually do it and you'll get
hand-waving. Something about "neural networks," maybe "trained on the internet."

**BEN:** That's a shaky foundation for the people making decisions about these
tools---teachers, parents, policymakers.

**EDDIE:** So what if you could build one yourself? Not on a computer. With a
picture book, some paper, a pen, and a handful of dice.

_Visual: montage---hands tallying a grid, a d10 rolling, a cup of counters
tipped out, a ledger row with coloured boxes, text appearing word by word._

**EDDIE (VO):** That's LLMs Unplugged, a set of free teaching resources from the
School of Cybernetics at the Australian National University.

**BEN (VO):** Every lesson is the same loop. First you train: read a text, and
count which word follows which. Then you generate: take the last word you wrote,
pick the next one according to those counts, write it down, and go again.

_Visual: train → generate loop animation; a grid filling with tallies, then a
die landing and a word appearing._

**EDDIE (VO):** There are two lessons to do it. _My First Language Model_ uses
grid paper and dice, and suits high school through to adults. In an hour or two
you train a model, generate from it, then generate from a bigger booklet that
somebody else trained---and finish by turning it into an agent that texts your
friends.

_Visual: the grid deck's hero backgrounds cycling---training, generation,
pre-trained booklet, agentic AI._

**BEN (VO):** _How AI writes stories_ is for ages ten to sixteen. The model is a
few ledger sheets, and the dice are a cup of coloured counters. You generate
first, from a finished model, so you know what every mark is for; then you train
your own from a new text; then the whole class pools its models into one story.

_Visual: the ledger deck's sheets, a cup being filled, the class story on
butchers paper._

**EDDIE:** Now, it's not a tiny ChatGPT. A real model swaps the tally marks for
shared numbers, looks at the whole conversation instead of one word, trains on
trillions of words, and gets a round of extra training so it answers you rather
than just continuing.

**BEN:** But it's the same loop. Tokens in, tokens out. And none of it is new:
Andrey Markov was doing this by hand in 1913, Claude Shannon in 1948. The line
runs straight to today's frontier models.

**EDDIE:** Once you've seen the mechanism on paper---patterns in, new text
out---the mystery evaporates. And if you want to go further, the site has
follow-on lessons: break a model, look inside one, shape its personality.

**BEN (TC):** Everything's under a Creative Commons licence at
llmsunplugged.org. Every section of both lessons has its own short video, so you
can play them in class. Grab the resources, run the activities, and if you'd
like us to deliver it in person, get in touch.
