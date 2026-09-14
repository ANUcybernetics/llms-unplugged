# Pre-trained generation

**Key idea:** you can generate from a model you didn't train---just follow its
lookup rules and sample next words.

**Plays:** My First Language Model, start of the Pre-trained generation section.

## Beat sheet

1. hook: this looks like the exercise you just did, again. It isn't---it's the
   first turn of a dial that ends at Claude or ChatGPT
2. framing: most people who use Claude or ChatGPT never trained it; somebody else did the
   counting. That's what this booklet is
3. booklet mechanics: each entry is a word, with the words that can follow it
   and a threshold for each
4. usage: pick a starting word, find its entry, roll a d10, take the first
   threshold at or above your roll, write the word, go to its entry
5. scaling beat: BUT some words have more than ten options. The diamonds say how
   many d10s to roll; read the digits as one number (a 5 and an 8 is 58). Same
   mechanism, scales as far as you want
6. single option: no roll needed
7. what to listen for: it'll sound more like real prose than your grid did, and
   it still won't be _about_ anything
8. stretch: can you guess the training text before you check the cover?
9. honesty about scale: real training data isn't one book---billions of pages
   from many sources; the single mystery text is what makes the game playable
10. open weights aside: you can read every number in this model and generate at
    the kitchen table; nobody can switch it off
11. CTA: roll now; make your own booklets at llmsunplugged.org/tools

## Script

**USHINI (TC):** This next bit looks like the exercise you just did, again. It
isn't. It's the first turn of a dial that ends at Claude or ChatGPT.

**BEN:** Most people who use Claude or ChatGPT never trained it. Somebody else did the
counting; you type a prompt and it generates. That's exactly what this booklet
is: a model somebody else already trained, on a much bigger text than yours.

_Visual: a booklet on the desk, top-down, its cover title hidden under a flat
card. It opens to a page rendered from the CLI: a bold headword, the list of
next words beneath it, a threshold beside each._

**BEN (VO):** Each entry is a word. Under it are the words that can follow, each
with a threshold. Pick a starting word, find its entry, roll a d10, and take the
first threshold at or above your roll. Write the word down, turn to its entry,
roll again.

_Visual: push in on one entry. A d10 face lands beside it; the thresholds light
from the top until the first one at or above the roll, and its word writes onto
the paper below. Cut to that word's entry on another page._

**USHINI (VO):** Some words have more than ten options. Look for the diamonds:
one diamond, one die; two diamonds, roll two and read them as digits, so a five
and an eight is fifty-eight. Same mechanism, and it scales as far as you want.
And if an entry has only one option, don't roll---just write it.

_Visual: an entry with two diamonds beside its headword. Two faces land, a five
and an eight, slide together and read 58; the thresholds light down to the first
at or above it. Then an entry with one follower: no die, the word writes
straight on._

**BEN:** As you go, listen to what comes out. It'll sound more like real prose
than your grid did. And it still won't be _about_ anything. Hold onto that
question.

_Visual: the paper: the booklet's line so far, above the grid's shorter line
from the last video, both in pencil._

**USHINI:** Your booklet was trained on a real text---maybe _Frankenstein_,
maybe _Green Eggs and Ham_. The patterns leak through. Try to guess the book
before you check the cover.

_Visual: the covered title card; on the paper a few of the generated words light
in turn, the tells._

**BEN:** One honest note: a real model isn't trained on one book. It's billions
of pages stitched together from everywhere. The single mystery text is just what
makes this game playable.

_Visual: the booklet shrinks to a tile; behind it a wall of page tiles fills the
frame and keeps receding, logarithmically, until the wall is texture._

**USHINI:** And one thing the booklet gets exactly right: you can read every
number in this model, and generate from it at the kitchen table. Nobody can
switch it off or quietly change it under you. That's what "open weights" means.

_Visual: the booklet open on a kitchen table, flat top-down, a mug beside it;
the threshold numbers on the page light one after another down the column._

**BEN (TC):** Grab your booklet and start rolling. If you'd like to make your
own from any text, the tool's at llmsunplugged.org/tools.
