# Overview

**Key idea:** you can run the same next-word loop that Claude or ChatGPT runs,
by hand, with a picture book, paper and a pen, and the site has the lessons and
the tools to do it.

**Plays:** website scene-setter, not in class. Evergreen: it names no lesson,
age band or running time, so it survives the lessons changing. The concrete
examples are the materials (grid and die, ledger sheets and cup), which are the
slowest-moving things on the site.

**Layout:** anything that shares the frame is stacked vertically, never side by
side, so the portrait variant restacks the same composition.

## Beat sheet

1. hook: Claude, ChatGPT: they write one word at a time, picking each from a
   list of likely next words. That operation, you can do by hand
2. pushback: BUT ask anyone how it actually works and you get
   hand-waving---shaky foundation for teachers, parents, policymakers
3. the claim: THEREFORE build the loop yourself. A picture book, paper, a pen,
   and either dice or a cup of counters (School of Cybernetics, ANU)
4. the loop: train (count which words follow which) → generate (pick the next
   word by those counts, write it down, repeat)
5. two ways on paper: grid paper and a ten-sided die, or ledger sheets and a
   cup of coloured counters. Either way: train your own, generate from one
   somebody else trained, then the bigger ideas (a model that pauses to ask for
   help; a room pooling its models). Runs from upper primary to the boardroom
6. honesty beat: not a tiny Claude or ChatGPT. A real model swaps the tallies
   for shared numbers, reads the whole conversation instead of one word, trains
   on trillions of words, and gets a round of post-training so it answers
   rather than continues. BUT it's the same loop: tokens in, tokens out
7. history: Markov 1913, Shannon 1948, straight through to today's frontier
   models
8. beyond: the site goes further---break a model, look inside one, shape how it
   behaves (described, never titled)
9. tools: everything on the site is made by tools that are on the site. Paste
   in any text and out come the booklets, sheets and cutouts for it
10. CTA: Creative Commons licence (no clause named) at llmsunplugged.org; every
    section of every lesson has its own video; book us in person

## Script

**BEN (TC):** Claude, ChatGPT, all of these tools---they write one word at a
time. Predict a word, add it, predict again. That's the whole job.

_Visual: a chat window, a reply typing itself one word at a time, each word
pausing as it lands._

_Reads (draft):_ 1. the reply isn't written all at once; 2. each word is added,
then the next is predicted.

**USHINI (TC):** And yet, ask someone how they actually do it and you'll get
hand-waving. Something about "neural networks," maybe "trained on the internet."

_Visual: the chat window dims; over it, in the site's type, the two phrases
people reach for: "neural networks", "trained on the internet"._

_Reads (draft):_ 1. these are the usual explanations people offer; 2. they name
things without explaining the mechanism.

**BEN:** That's a shaky foundation for the people making decisions about these
tools---teachers, parents, policymakers.

**USHINI:** So what if you could build one yourself? Not on a computer. With a
picture book, some paper, a pen, and a handful of dice.

_Visual: the desk, top-down, empty. A picture book, a grid sheet, a pencil, a
d10, a cup of counters and a ledger sheet slide into place, one per word as it
is named._

_Reads (draft):_ 1. this is all the equipment it takes; 2. there's no computer
on the desk.

_Reads note:_ the line names a book, paper, a pen and dice, so the cup of
counters and the ledger sheet have no word to land on and can't arrive "one per
word as it is named".

**USHINI (VO):** That's LLMs Unplugged, a set of free teaching resources from
the School of Cybernetics at the Australian National University.

_Visual: the LLMs Unplugged wordmark in the site's type over the desk, the
School of Cybernetics line beneath it._

_Reads (draft):_ 1. this is LLMs Unplugged; 2. it comes from the School of
Cybernetics at ANU.

**BEN (VO):** Every lesson is the same loop. First you train: read a text, and
count which word follows which. Then you generate: take the last word you wrote,
pick the next one according to those counts, write it down, and go again.

_Visual: the loop as one drawn stroke, top to bottom: the book; the grid,
strokes drawing on as the book's pairs fly into cells; the paper, a word
writing, a d10 face landing, the next word writing; an arrow back to the top.
Two arcs labelled train and generate._

_Reads (draft):_ 1. training: the book's word pairs are counted into the grid; 2. generating: the counts pick the next word, which gets written down; 3. then
round again from the word just written.

**USHINI (VO):** There are two ways to do it on paper. One is grid paper and a
ten-sided die: you count word pairs into a grid, then roll your way to a
sentence. The other is ledger sheets and a cup of coloured counters: more marks,
more counters, more likely.

_Visual: two vignettes stacked: the grid filling and a die landing; counters
dropping into the cup and one sliding out._

_Reads (draft):_ 1. one way: count pairs into a grid, then roll a die; 2. the
other way: counters in a cup, draw one out; 3. more counters for a word, more
likely it comes out.

_Reads note:_ the ledger vignette shows counters but no marks, so "more marks,
more counters" has nothing on screen to map to.

**BEN (VO):** Either way, you start by training a model of your own. Then you
generate from one that somebody else trained. And from there the same loop
takes you to the bigger ideas: a model that pauses to ask for help, or a whole
room pooling its models into one story. It runs from upper primary to the
boardroom.

_Visual: three vignettes stacked: the booklet open at an entry; the phone with
a reply bubble sliding onto the paper; butchers paper up front gaining a line._

_Reads (draft):_ 1. next, generate from a model somebody else trained; 2. the
same loop leads to a model that asks for help; 3. and to a whole room pooling
its models.

_Reads note:_ the line starts with training your own model, but none of the
three vignettes shows that, so the viewer may map the booklet to "your own".

**USHINI:** Now, it's not a tiny Claude or ChatGPT. A real model swaps the tally
marks for shared numbers, looks at the whole conversation instead of one word,
trains on trillions of words, and gets a round of extra training so it answers
you rather than just continuing.

_Visual: the grid's tally strokes turn into decimal numbers; the numbers slide
into one long row that runs off both edges of the frame, and the row scrolls,
and scrolls._

_Reads (draft):_ 1. real models store numbers, not tally marks; 2. and vastly
more of them than fits on a sheet.

**BEN:** But it's the same loop. Tokens in, tokens out. And none of it is new:
Andrey Markov was doing this by hand in 1913, Claude Shannon in 1948. The line
runs straight to today's frontier models.

_Visual: the chat reply and a pencil line on paper advancing one word at a time
in lockstep, one above the other. Then a timeline draws on as a single stroke,
1913 Markov, 1948 Shannon, on to today, the loop icon riding along it
unchanged._

_Reads (draft):_ 1. the chat reply and the pencil are doing the same thing; 2.
people have run this loop since Markov in 1913; 3. the loop itself hasn't
changed since.

**USHINI:** Once you've seen the mechanism on paper---patterns in, new text
out---the mystery evaporates. And if you want to go further, the site does:
break a model, look inside one, shape how it behaves.

_Visual: three vignettes stacked: a grid with one cell ringed; the same grid
with a number in every cell; a booklet page with a line struck out and
rewritten._

_Reads (draft):_ 1. you can break a model; 2. you can look inside one; 3. you
can shape how it behaves.

**BEN (VO):** And everything on the site was made by tools that are on the site
too. Paste in any text you like, and out come the booklets, the sheets and the
cutouts for it. Your book, your model.

_Visual: the tools page: a text pasted into the box, a booklet page rendering
beneath it, then a ledger sheet._

_Reads (draft):_ 1. paste in any text; 2. out come the printable materials for
that text.

**USHINI (TC):** It's all under a Creative Commons licence at llmsunplugged.org.
Every section of every lesson has its own short video, so you can play them in
class. Grab the resources, run the activities, and if you'd like us to deliver
it in person, get in touch.

_Visual: llmsunplugged.org in the site's type over the desk, then the section
videos as a stacked list, then the Creative Commons mark._

_Reads (draft):_ 1. it's all at llmsunplugged.org; 2. each lesson section has
its own video; 3. it's free to use under Creative Commons.
