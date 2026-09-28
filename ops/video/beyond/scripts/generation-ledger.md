# Generation: ledger

**Key idea (draft):** text is written one word at a time, each word picked at
random in proportion to the counts: the cup makes every text different, and the
counts make them all sound like the book.

**Plays:** How AI writes stories (ledger), start of the Generation section.
Never assumes the room did the counting, so it plays whether the sheets arrived
finished (the lesson's usual order) or the room filled them in first; there is
no separate pre-trained ledger video.

**Builds on:** `partials/ledger-read.mdx` plus `partials/ledger-generation.mdx`
up to its "Your turn", which the ending hands off to. The model is _The
magpie_'s real ledger (the row for full stop is it 7 red, here 4 blue, down 3
green, swoop 3 yellow; for _it_, sits 3 red, watches 3 blue, goes 3 green, is 1
yellow; for _the_, magpie 5 red, fence 6 blue, postie 4 green, dog 4 yellow; for
_dog_, full stop 2 red, runs 2 blue). The walk is ". it sits on the dog .", a
sentence the book never says; the deck's own walk draws differently from the
same cups.

## Beat sheet

1. hook: a pile of sheets is about to write a sentence nobody has ever written
2. the model: a row per word, and what came next, counted. Maybe you did the
   counting, maybe the sheets arrived finished; it works the same either way
3. the colours: a counter's colour names a box's place in the row, not a word,
   so one set of counters works for every row
4. start after a full stop. Fill the cup, one counter per mark: "it" has seven
   chances in seventeen. Draw one: "it"
5. the row for _it_: ten counters, draw red, "sits"
6. single-option rows: no cup needed ("on", "the")
7. the row for _the_, then _dog_: two more draws, and a full stop
8. the sentence: "It sits on the dog." The book never says it. Nobody wrote it;
   the counting did
9. **beyond:** the tree of everything this model could have written from a full
   stop, branch thickness by probability. Your sentence is one path through it
10. **beyond:** run it ten thousand times and count what comes out: the counts
    come back
11. that's the loop Claude or ChatGPT runs, with vastly more counts
12. ending: four jobs, then go

## Script

**BEN (TC):** This is a pile of sheets full of counts. In about a minute it's
going to write a sentence that nobody has ever written.

_Visual: the magpie's ledger sheets fanned on the desk, top-down, full frame.
Nothing moves but the marks' boil._

_Reads (draft):_ 1. these sheets are a finished model.

**USHINI (VO):** Each row is a word from a book, and the words that came next,
with a mark every time. Maybe you did the counting yourselves; maybe the sheets
arrived finished. It works the same either way.

_Visual: the sheets gather into one; the row for "the" lights: magpie, fence,
postie, dog in red, blue, green and yellow boxes, each with its marks._

_Reads (draft):_ 1. a row is a word; 2. its boxes are what came next and how
often.

**BEN (VO):** Every box has a colour, always in the same order: red, blue,
green, yellow. On this row, red means "magpie". On another row, red means
something else.

_Visual: a red counter slides in beside the row for "the" and the red box
lights: magpie. The counter slides down to the row for "it", and its red box
lights: sits._

_Reads (draft):_ 1. the boxes run red, blue, green, yellow; 2. a colour names a
place in the row, not a word.

**USHINI (VO):** A story starts after a full stop, so find the row for full
stop. Fill a cup with one counter for every mark: seven red for "it", four blue
for "here", three green, three yellow.

_Visual: the row for full stop slides out of the sheet. Its marks lift off box
by box, red first, and become counters that drop into a cup seen from above:
seven red, four blue, three green, three yellow._

_Reads (draft):_ 1. start from the full stop's row; 2. each mark becomes one
counter in its box's colour; 3. "it" has the most counters.

**BEN (VO):** Seventeen counters. Now draw one without looking. Red: "it". Write
it down, tip the cup back, and go to the row for "it".

_Visual: a red counter slides out of the cup; the red box on the row lights and
"it" writes onto a strip of paper at the bottom of the desk. The cup empties.
The row for "it" lights._

_Reads (draft):_ 1. the counter's colour names the next word; 2. that word is
written down; 3. the cup empties and its row is next.

**USHINI (VO):** The row for "it": three red, three blue, three green, one
yellow. Red again: "sits".

_Visual: ten counters drop into the cup; a red one comes out and "sits" writes
onto the strip._

_Reads (draft):_ 1. a new row fills a new cup; 2. red on this row means "sits".

**BEN (VO):** "Sits" is only ever followed by "on", and "on" by "the". One box,
no cup.

_Visual: the rows for "sits" and "on" light in turn, each with a single red box,
and "on" and "the" write straight onto the strip._

_Reads (draft):_ 1. a row with one word needs no draw.

**USHINI (VO):** The row for "the" fills the cup with all four colours. Yellow:
"dog". And after "dog", two red for a full stop, two blue for "runs". Red: full
stop.

_Visual: nineteen counters in four colours drop into the cup; a yellow one comes
out and "dog" writes on. Then four counters, two red, two blue; a red one comes
out and the full stop tile writes on._

_Reads (draft):_ 1. every row works the same way; 2. a full stop ends the
sentence.

**BEN:** "It sits on the dog." The book never says that. It says the magpie sits
on the fence. Nobody wrote this sentence; the counting did.

_Visual: the strip reads "it sits on the dog ." Above it, in the book's type,
"It sits on the fence." and "Here comes the dog."; the halves slide together
into the generated line._

_Reads (draft):_ 1. this sentence isn't in the book; 2. it's made from pieces
that are; 3. nobody wrote it.

**USHINI (VO):** And here's everything this model could have written instead.

_Visual: as in `generation-grid`: the strip's words slide into a column at the
left edge, the full stop tile moves to the root, and every path the counts allow
grows rightwards, twelve words deep, each branch as thick as it is likely. The
path "it sits on the dog ." lights gold; the rest dims. (The prototype at
`prototype-tree/`.)_

_Beyond:_ the slides show one walk, so the viewer sees one sentence and has to
imagine the others. The tree shows them all at once, weighted, and makes the key
idea literal: the counts already hold every text, and the cup only picks a path.

_Reads (draft):_ 1. each branch is a word the counts allow; 2. thicker means
more likely; 3. your sentence is one path through it.

**BEN (VO):** Every draw picks a different path. So run it ten thousand times
and count what comes out.

_Visual: the tree fades to a blank ledger sheet. Generated words stream past
along the bottom at machine speed while their pairs are marked into the blank
sheet. The row for "the" is held up beside the original's: after twenty words
its boxes look nothing like it; after ten thousand, the proportions match._

_Beyond:_ one walk can't show that sampling is faithful, and "it sounds like the
book" stays a feeling. Counting the model's own output back into a sheet shows
the proportions return, so "sounds like the book" becomes something the viewer
can check.

_Reads (draft):_ 1. the model's output is counted the same way as the book
was; 2. a short run looks nothing like the book's counts; 3. a long run matches
them.

**USHINI:** Every story different. Every story sounding like the book. That's
what Claude or ChatGPT is doing every time it writes a word, with vastly more
counts than this.

**BEN (VO):** Four jobs in your group. A reader finds the row. A filler puts one
counter per mark in the cup. A drawer pulls one out. And a writer writes the
word down. Tip the cup back every time.

_Visual: the ledger sheets fanned, the cup, the counter tub, the paper strip:
each lights in turn as its job is named. The cup tips back into the tub._

_Reads (draft):_ 1. four jobs; 2. one counter per mark; 3. empty the cup between
draws.

**USHINI (TC):** Reader, find the full stop. Let's see what your book says.
