# Making things up

**Key idea:** familiar word pairs can produce new sentences; answering a
question accurately requires checking the sentence against evidence.

**Plays:** standalone, and in class after generation (any format): the question
every class asks about AI, answered from the model they just used.

**Builds on:** the generation run of any deck (the viewer has drawn a sentence
from counts), and the magpie model from the generation videos. Numbers are from
the magpie counts, taking every sentence from a full stop to a full stop or
exclamation mark, up to ten words and marks long: 62 sentences, 8 of them in the
book. From a full stop, "It watches." is the likeliest sentence (11%), then "It
is spring." (5.7%) and "It sits on the fence." (5.1%), all three in the book;
then, tied at 4.4%, "Here comes the fence.", "Down swoops the fence." and "Back
goes the fence.", which the book never says; "Here comes the dog.", which it
does, is 3.3%. About a third of draws (36%) land on one of those eight book
sentences.

## Beat sheet

1. hook: a fluent answer still needs checking against a source
2. read what the book says about the magpie and the dog
3. generate "Down swoops the dog."
4. compare it with the source when answering who swoops down
5. trace every adjacent pair back to the book
6. rank the short sentences by probability; three new fence sentences outrank
   one the book says
7. colour the 62 paths by whether their sentences occur in the book
8. distinguish a new sentence from an incorrect answer
9. connect source checking to larger models, without inventing an accuracy rate
10. hand off to checking the group's own sentences

## Script

**BEN (TC):** AI models sometimes give an answer that sounds right and isn't.
People call it hallucinating. Our paper model can do it too, and we can check it
against the book.

_Visual: the finished magpie grid on the desk beside the closed picture book._

_Reads:_ 1. the model and its source are both available to check.

**USHINI (VO):** In the book's story, the magpie swoops. The dog runs. The
magpie returns to the fence. We can check each of those against the page.

_Visual: the book opens. Highlight "Down swoops the magpie!", "Off runs the
dog.", and "It sits on the fence." one at a time._

_Reads:_ 1. the book describes specific events; 2. the magpie comes down.

**BEN (VO):** Now generate a sentence. [beat] "Down swoops the dog." [beat]

_Visual: the book closes; the grid returns. Write "down swoops the dog ." one
word at a time, lighting each row._

_Reads:_ 1. the model can recombine words into sentences absent from the book.

**USHINI:** Suppose we wanted an answer to "Who swoops down in the story?" Our
generated sentence says the dog. The book says the magpie. We'd need to check
the book before using that as an answer.

_Visual: keep the generated strip below the question "Who swoops down in the
story?". Reveal "Down swoops the magpie!" from the book above it. Highlight
"dog" and "magpie" in sequence. No illustration infers who swoops._

_Reads:_ 1. a source-based question needs a source-based answer; 2. the
generated answer names a different character from the source.

**BEN (VO):** Look at how it got there. [beat] "Down swoops the" is in the book.
[beat] "The dog" is in the book. [beat] A full stop after "dog" is in the book
too. [beat] Every pair is in the book. [beat] The sentence isn't.

_Visual: bracket each adjacent pair, lighting its grid cell and a matching
passage from the book. End with a bracket under the whole generated sentence._

_Reads:_ 1. every adjacent pair has a source; 2. combining them produces a new
sentence without checking what happened in the story.

**USHINI (VO):** Rank the short sentences by how likely they are. "It watches."
first. "It is spring." "It sits on the fence." All in the book. Then three it
never says: "Here comes the fence.", "Down swoops the fence." and "Back goes the
fence." [beat]

_Visual: reveal a ranked list with probability bars; highlight each named
sentence. The list uses complete sentences of at most ten tokens._

_Beyond:_ the exact ranking shows which combinations the counts favour.

_Reads:_ 1. sentence probabilities differ; 2. the likeliest new sentences all
end at the fence.

**BEN (VO):** Each of those is more likely than "Here comes the dog", which the
book actually says. In the counts, "fence" follows "the" as often as "dog" does,
and a full stop always follows "fence". After "dog", it's three times in four.

_Visual: compare the "here comes the fence" and "here comes the dog" bars, then
show the four tallies each for "the fence" and "the dog", the punctuation-only
row for "fence", and the row for "dog" (full stop 3, "and" 1)._

_Reads:_ 1. a new sentence can outrank one in the source; 2. the pair counts
explain its probability.

**USHINI (VO):** Here's every complete sentence up to ten tokens long, including
punctuation. Sixty-two of them. Eight are in the book. The other fifty-four are
new combinations.

_Visual: grow the tree; colour the eight source sentences gold and the other
fifty-four grey. Label the colours "in the book" and "new combination"._

_Beyond:_ distinguishes exact reproduction from recombination, using a model
small enough to enumerate.

_Reads:_ 1. there are 62 complete paths within this length limit; 2. eight occur
in the book; 3. colour describes source membership, not truth.

**BEN:** A new sentence isn't necessarily wrong. "Here comes the magpie" could
fit the story, even though the book doesn't say it. These colours tell us
whether a sentence was in the book. They don't tell us whether it's true.

_Visual: hold the labelled tree and reveal "here comes the magpie ." beside its
endpoint. Leave its colour grey; don't add a tick or a cross._

_Reads:_ 1. a new combination can be plausible; 2. absence from the book is not
evidence that something is false.

**USHINI (VO):** Larger models use more context and learn differently from our
counting grid. They can still produce incorrect answers. If you're using one to
answer a question about a source, check what the source actually says.

_Visual: return to the source passage and the generated answer beneath the
question. Highlight the source's "magpie" when checking is mentioned. No
invented proportions or larger-model probability tree._

_Reads:_ 1. the paper model illustrates a reason to check; 2. check the answer
against evidence, not just its familiar wording.

**BEN (TC):** Look back at the sentences you wrote. Which ones are true? Which
ones could you check against the book, and how would you know?
