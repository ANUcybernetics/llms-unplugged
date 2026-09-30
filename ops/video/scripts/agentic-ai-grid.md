# Agentic AI: grid

**Key idea:** a tool call is a token the model draws like any other word;
something outside the model (the harness) pauses, runs the tool and splices the
result back in.

**Plays:** My First Language Model, start of the Agentic AI section.

**Builds on:** `partials/grid-agentic-ai.mdx` from "Agentic AI" through "Worked
example"; the ending hands off to "Your turn". The slides' worked example is
"the cat sat" with any model; this video walks _The magpie_'s grid, where 29 of
the book's 133 words are punctuation and six rows (_fence_, _watches_, _swoop_,
_runs_, _goes_, _spring_) are only ever followed by it. The walk is ". here
comes the dog", then the row for _dog_ (full stop 0--4, runs 5--9), roll 3: a
tool call. The friend's reply ("and it wants my sandwich") is invented.

## Beat sheet

1. hook: agents are in the news, and they sound like a new kind of technology.
   It's the loop you already know, plus one rule
2. the rule: generate as before; any punctuation you roll is a tool call
3. **beyond:** the punctuation columns light down the whole magpie grid: every
   row's chance of rolling punctuation is its chance of calling the tool,
   sitting in the counts like any other word
4. the walk: ". here comes the dog", roll a three, full stop: stop
5. the tool: text three friends "What comes next?" with the sentence so far
6. the result: write down the first reply whole, then the punctuation you
   rolled, and carry on from the punctuation (the grid has no row for the
   friend's last word; it always has one for a full stop)
7. latency: leave a gap and back-fill
8. you were the harness: the model only learned when to ask; you paused it, sent
   the message and spliced the answer in
9. take the person out and the loop runs by itself: that's what the news means
   by an agent. What would you let it do without asking you?
10. ending: in a few minutes, you'll be the harness

## Script

**USHINI (TC):** This is the one that's all over the news. AI agents: models
that browse the web, write code, book flights. It sounds like a whole new kind
of technology. It isn't. It's the loop you've already run, with one rule added.

**BEN (VO):** Here's the rule. Generate from your grid exactly as before. But
the moment you roll a punctuation mark, a full stop or a comma, pause. That's a
tool call.

_Visual: the magpie grid on the desk, a d10 and a paper strip beside it. The
columns for full stop, comma and exclamation mark light gold, top to bottom._

_Reads:_ 1. generation is the same as before; 2. punctuation means stop; 3. that
stop is a tool call.

**USHINI (VO):** So the model doesn't decide to use a tool. It rolls one, like
any other word. Some rows almost never call it. Some always do.

_Visual: down the gold columns, each row's punctuation tallies brighten in
proportion to that row's share: the rows for "fence", "watches" and "runs" light
fully (nothing else ever follows them); "magpie" and "dog" light partway; "the"
and "it" stay dark._

_Beyond:_ the slides state the rule; this shows that "deciding" to call a tool
is the same draw as picking a word, which is the demystifying claim, and it's
how real models do it (a special token they learned to produce, sitting in the
numbers like any other).

_Reads:_ 1. a tool call is in the counts like any other word; 2. some rows call
it more than others.

**BEN (VO):** Say you've written "here comes the dog". The row for "dog": nought
to four is a full stop, five to nine is "runs". [beat] Roll a three. Full stop.
[beat] So pause.

_Visual: the strip reads "here comes the dog"; the row for "dog" lights and its
die strip draws on (full stop 0--4, runs 5--9). A face lands on 3, the full stop
band lights gold, the pencil stops, and a phone slides into frame._

_Reads:_ 1. an ordinary roll; 2. it lands on punctuation; 3. generation pauses.

**USHINI (VO):** The tool is a text message. Send "What comes next?", and the
sentence so far, to three friends or group chats.

_Visual: the phone, top-down: a message types itself, What comes next? "here
comes the dog…", and copies slide up to three contact rows. A beat of nothing.
One reply bubble drops in: and it wants my sandwich._

_Reads:_ 1. the tool is a text message; 2. it sends the sentence so far; 3. it
goes to three people at once.

**BEN (VO):** The first reply back, "and it wants my sandwich", is your tool
result. Write the whole thing down, then the full stop you rolled. [beat] Then
carry on, from the full stop.

_Visual: the reply's words slide off the phone onto the strip after "here comes
the dog", the full stop follows them, and the row for full stop lights on the
grid; a face lands and the pencil moves again._

_Reads:_ 1. the first reply is written down whole; 2. then the full stop you
rolled; 3. generation carries on from the full stop.

**USHINI:** Why from the full stop, and not from "sandwich"? Because your grid
has no row for "sandwich". But it always has one for a full stop.

_Visual: the grid's row headers scroll past, and the gap where "sandwich" would
be lights empty. Cut to the row for full stop, present and lit._

_Reads:_ 1. the grid has no row for the friend's word; 2. the full stop always
has one, so continue from there.

**BEN:** Replies take time. If nothing's back by your next punctuation mark,
leave a gap and fill it in later.

_Visual: the strip: a bracketed gap left after a full stop, the pencil carrying
on past it; later a reply's words slide into the gap._

_Reads:_ 1. you don't wait for a slow reply; 2. leave a gap, keep going, fill it
in later.

**USHINI:** Here's the bit that matters. The model never learned what comes next
after "the dog". It only rolled when to ask. And the thing that paused it, sent
the message, and spliced the answer back in? That was you. You were the harness.

_Visual: the loop draws on in one stroke, gold arrowheads: roll, punctuation,
pause, message out, reply in, carry on. A flat person icon at its centre; as
each stage is named its arrow lights, and the icon's hand is on every one._

_Reads:_ 1. the model only rolled when to ask; 2. a person did every step of the
hand-off; 3. that person is the harness.

**BEN:** Take the person out, and you've got a model acting on its own. That's
what the news means by an agent. So: what would you let it do without asking you
first?

_Visual: the person icon fades; the loop keeps running on its own, arrows
lighting in turn._

_Reads:_ 1. without the person, the loop runs by itself; 2. that's what the news
means by an agent.

**USHINI (TC):** Don't answer yet. In a few minutes, you'll be the harness.
