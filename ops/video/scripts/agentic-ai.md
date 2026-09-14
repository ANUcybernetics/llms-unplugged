# Agentic AI

**Key idea:** an agent is a model that runs tools in a loop---pausing
generation, handing off to something outside itself, and continuing with the
result spliced in.

**Plays:** My First Language Model, start of the Agentic AI section.

## Beat sheet

1. hook: agents are all over the news---models that browse, write code, book
   flights. Sounds like new tech. It's the loop you've already run, plus one
   rule
2. definition: an agent is a model that can pause, get something from outside
   itself, and carry on
3. the rule: generate as before; every punctuation token you roll is a tool call
4. the tool: text three friends or group chats---"What comes next? _'the cat
   sat…'_"---everything since the last full stop
5. the result: write down the whole of the first reply, then the punctuation you
   rolled
6. continue from the punctuation, not from the friend's last word (their words
   probably aren't in your model's vocabulary; the model can always continue
   from a full stop)
7. latency: replies take time---leave a gap and back-fill
8. key insight: the model never learned the answer. What it "learned" is when to
   ask. And the thing that paused it, sent the text and spliced the reply back
   in was _you_---you were the harness
9. connection: take the person out and you've got an agent acting on its own.
   That's what the coverage means. So what would you let it do without asking
   you first?
10. CTA/kicker: in a few minutes, you'll BE the harness

## Script

**EDDIE (TC):** This is the one that's all over the news. AI agents: models that
browse the web, write code, book flights. It sounds like a whole new kind of
technology. It isn't. It's the loop you've already run, with one rule added.

**BEN:** An agent is a model that can pause, get something from outside itself,
and carry on.

_Visual: the agentic loop---generate, punctuation, pause, phone message out,
reply in, generation continues._

**BEN (VO):** Here's the rule. Generate from your booklet exactly as before,
rolling for each next word. The moment you roll a punctuation token---a full
stop, a comma---stop. That's a tool call.

**EDDIE (VO):** The tool is a text message. Send "What comes next?" and the
sentence so far---everything since the last full stop---to three friends or
group chats. Say your text is "the cat sat" and you've just rolled a full stop.
You text: _What comes next? "the cat sat…"_

_Visual: phone overlay---the message going out to three contacts, one reply
coming back: "down by the river"._

**BEN (VO):** The first reply back is your tool result. Write down the whole
thing---"down by the river"---and then the full stop you rolled. Then keep
generating, from the full stop.

_Visual: StaticPretrainedGeneration resuming from "."; the spliced text reads
"the cat sat down by the river."_

**EDDIE:** Why from the full stop and not from "river"? Because "river" probably
isn't in your model. It has no entry for it. But it can always continue from a
full stop.

**BEN:** Replies take time. If nothing's landed by your next punctuation token,
leave a gap and fill it in later.

**EDDIE:** Here's the bit that matters. The model never learned what comes next.
What it "learned" is when to ask. And the thing that paused it, sent the
message, and spliced the answer back in---that was you. You were the harness.

**BEN:** Take the person out, and you've got a model acting on its own. That's
what the coverage means by an agent. So: what would you let it do without asking
you first?

**EDDIE (TC):** Don't answer yet. In a few minutes, you'll _be_ the harness.
