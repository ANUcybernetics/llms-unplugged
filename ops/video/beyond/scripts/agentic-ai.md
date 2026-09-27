# Agentic AI

**Key idea (draft):** a tool call is a token the model samples like any other
word; something outside the model (the harness) pauses, runs the tool and
splices the result back in.

**Plays:** My First Language Model, start of the Agentic AI section.

**Builds on:** `partials/grid-agentic-ai.mdx` from "Agentic AI" through "Worked
example". The walk is the deck's (the punctuation token as the tool call, the
text message as the tool).

_Script to follow once Ben has noted `training` and `generation`._

## Beat sheet

1. hook: agents are in the news, and they sound like a new kind of technology.
   It's the loop you already know, plus one rule
2. the rule: generate as before; any punctuation token you roll is a tool call
3. **beyond:** the punctuation columns light down the whole magpie sheet: every
   row's chance of rolling punctuation is its chance of calling the tool,
   sitting in the counts like any other word. _Beyond:_ the slides state the
   rule; this shows that "deciding" to call a tool is the same draw as picking a
   word, which is the demystifying claim, and it's how real models do it (a
   special token they learned to produce)
4. the tool: text three friends "What comes next?" with the sentence so far
5. the result: write down the first reply whole, then the punctuation you
   rolled, and carry on from the punctuation (the model has no row for the
   friend's last word; it always has one for a full stop)
6. latency: leave a gap and back-fill
7. you were the harness: the model only learned when to ask; you paused it, sent
   the message and spliced the answer in
8. take the person out and the loop runs by itself: that's what the news means
   by an agent. What would you let it do without asking you?
9. ending (booklet): in a few minutes, you'll be the harness
