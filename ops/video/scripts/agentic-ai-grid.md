# Agentic AI: grid

**Key idea:** a tool call is a token the model draws like any other word;
something outside the model (the harness) pauses, runs the tool and splices the
result back in.

**Plays:** My First Language Model, start of the Agentic AI section.

**Builds on:** `partials/grid-agentic-ai.mdx` from "Agentic AI" through "Worked
example"; the ending hands off to "Your turn". The slides' worked example is
"the cat sat" with any model; this video walks _The magpie_'s grid, where 19 of
the book's 100 words are punctuation and four rows (_fence_, _watches_,
_spring_, _magpie_) are only ever followed by it. The walk is ". here comes the
dog", then the row for _dog_ (full stop 0--7, _and_ 8--9), roll 3: a tool call.
The friend's reply ("and it wants my sandwich") is invented.

## Beat sheet

1. hook: a model can generate a request for a tool; the activity makes the
   hand-off visible
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
8. you were the harness: the model selected punctuation; you sent the message
   and added the reply
9. software can do the harness's jobs; larger models can use the reply when
   choosing what to do next, whereas this paper model restarts from punctuation
10. ending: discuss which actions should need permission, then run the activity

## Script

**USHINI (TC):** An AI agent can use tools, such as a web browser, while it
works on a task. We'll add a tool to our paper model: sending a text message.
It's a way to see who does what when a model asks for help.

**BEN (VO):** Here's the rule. Generate from your grid exactly as before. But
the moment you roll a punctuation mark, a full stop or a comma, pause. That's a
tool call.

_Visual: the magpie grid on the desk, a d10 and a paper strip beside it. The
columns for full stop, comma and exclamation mark light gold, top to bottom._

_Reads:_ 1. generation is the same as before; 2. punctuation means stop; 3. that
stop is a tool call.

**USHINI (VO):** In our activity, the model rolls punctuation like any other
word. Some rows never call the tool. Some always do.

_Visual: down the gold columns, each row's punctuation tallies brighten in
proportion to that row's share: the rows for "fence", "watches", "spring" and
"magpie" light fully (nothing else ever follows them); "dog" and "postie" light
partway; "the" and "it" stay dark._

_Beyond:_ the punctuation counts show where this activity calls the tool. Real
models generate tool requests as text too, but learn to do so differently; they
are not trained by counting punctuation pairs._

_Reads:_ 1. a tool call is in the counts like any other word; 2. some rows call
it more than others.

**BEN (VO):** Say you've written "here comes the dog". The row for "dog": nought
to seven is a full stop, eight or nine is "and". [beat] Roll a three. Full stop.
[beat] So pause.

_Visual: the strip reads "here comes the dog"; the row for "dog" lights and its
die strip draws on (full stop 0--7, "and" 8--9). A face lands on 3, the full
stop band lights gold, the pencil stops, and a phone slides into frame._

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

**USHINI:** Our grid has no row for "sandwich". We restart from the full stop so
we have a row to use. That also means the reply cannot change our model's next
choice.

_Visual: the grid's row headers scroll past, and the gap where "sandwich" would
be lights empty. Cut to the row for full stop, present and lit._

_Reads:_ 1. the grid has no row for the friend's word; 2. the full stop always
has one, so continue from there.

**BEN:** Replies take time. If nothing's back, leave a gap before the
punctuation mark. Write the mark and keep going from its row. [beat] Fill the
gap when the first reply arrives.

_Visual: the strip: a bracketed gap left before the full stop, the pencil
carrying on past it; later a reply's words slide into the gap._

_Reads:_ 1. you don't wait for a slow reply; 2. leave a gap, keep going, fill it
in later.

**USHINI:** The model rolled a full stop after "dog". You paused it, sent the
message, and added the reply before carrying on. Those jobs make you the
harness: the part that connects the model to its tools.

_Visual: the loop draws on: roll, punctuation, pause, message out, reply in,
carry on. A person at its centre connects each hand-off._

_Reads:_ 1. the model selected punctuation; 2. the person handles the tool
call; 3. that person is doing the harness's jobs.

**BEN:** Software can do those jobs too. In a larger model, the reply can inform
what happens next: a search result might lead to another search. Our paper model
always carries on from the punctuation row.

_Visual: the person is replaced by a panel labelled "software"; the loop stays
connected. A second arrow links "reply in" back to the model's choice, labelled
"larger model". The paper model's punctuation path remains visible._

_Reads:_ 1. software replaces the person's work; 2. larger models can use the
tool result in their next choice; 3. the paper model's restart loses that
context.

**USHINI (TC):** What would you let an agent do without asking you first? Pause
here and discuss that with your group. [beat 2] Then try the activity, with your
group doing the harness's jobs.
