# Training (ledger)

**Key idea:** every mark on the sheet came from somebody reading the text two
words at a time.

**Plays:** How AI writes stories (ledger), start of part 5 (Training).

## Beat sheet

1. hook: your sheets arrived finished. Where did the marks come from? Somebody
   counted. Now it's your turn
2. the text: lowercase everything; full stops and exclamation marks are words
   too
3. read two words at a time: the first word names the row, the second word gets
   a mark in that row
4. move along by one: the second word of this pair is the first word of the
   next, so you read the text once and every pair gets counted
5. the same pair comes round again: the second _see it_ puts a second mark
   beside _it_ in the row for _see_. That's how a count builds---common pairs
   collect marks, rare ones don't
6. check: the printed sheet says _see it_ five times. Count the book and it's
   five. Every sheet in the room was made this way
7. your turn: a new text, blank sheets, the words are yours to write as well as
   the marks. One person reads pairs; whoever has the first word's row marks the
   second
8. rules that keep the model honest: say a new word out loud when you start its
   row (two people counting the same word splits the model in half); next empty
   box, never skip one (the colours go in order); the row for full stop says how
   sentences start
9. then generate from _the_: it should sound like your text and nobody else's
10. reveal: that's training. Not a computer reading the internet---somebody
    counting what came next, a lot
11. CTA: reader, grab the text. Two words at a time

## Script

**EDDIE (TC):** Your sheets arrived finished. Every mark was already there. So
where did the marks come from?

**BEN:** Somebody counted. And it's a job you can do yourselves.

_Visual: LedgerTraining with the opening of Dick and Jane, lowercased, the full
stops and exclamation marks shown as their own tokens._

**BEN (VO):** Start with a text. Lowercase everything. And notice that full
stops and exclamation marks are words too---they get their own rows.

_Visual: LedgerTraining stepping---the first pair highlighted, a mark appearing
in the first word's row beside the second word._

**EDDIE (VO):** Read it two words at a time. The first word names the row. The
second word gets a mark in that row. Then move along by one: the second word of
this pair is the first word of the next. Read the text once, and every pair in
it gets counted.

_Visual: LedgerTraining skipping ahead to the second "see it"; the mark beside
"it" in the row for "see" going from one to two._

**BEN (VO):** Keep going and the same pair comes round again. The second time
the text says "see it," the mark goes beside _it_ in the row for _see_, which
already has one. That's how a count builds. Common pairs collect marks; rare
ones don't.

**EDDIE:** Check it against your printed sheet. _See it_, five marks. Count the
book and it's five. Every sheet in this room was made exactly this way.

**BEN:** Now it's your turn, on a new text, with blank sheets. This time the
words are yours to write as well as the marks. One person reads the text two
words at a time. Whoever has the row for the first word puts a mark beside the
second.

_Visual: a blank ledger sheet; a hand writing a new word into a spare row, then
a mark beside it._

**EDDIE (VO):** Three rules keep your model honest. When you start a row for a
new word, say the word out loud, so nobody else starts one too---two people
counting the same word splits the model in half. A new word goes in the next
empty box, never a skipped one---the colours go in order. And the row for full
stop is a real row: it says how sentences start.

**BEN:** When you've read the whole text, generate from it. Start from _the_. It
should sound like your text, and nobody else's.

**EDDIE:** That's training. Not a computer reading the internet. Somebody
counting what came next, a lot.

**BEN (TC):** Reader, grab the text. Two words at a time.
