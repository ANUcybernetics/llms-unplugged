---
title: Tool Use
description:
  Teach your model to call external tools when it needs information it doesn't
  have.
order: 10
topic: controlling-output
keyIdea:
  Models can recognise when they need external help and delegate to tools that
  return results for continued generation.
---

# Tool Use

Extend your language model to call external tools---people, objects, or
resources in the room---when it needs information beyond what's in the grid.

![Hero image: Tool Use](/assets/images/hero-tool-use.avif)

<Prerequisites />

## You will need

- a completed model from an earlier lesson
- pen, paper, and dice as per _Grid Generation_
- people or props to serve as "tools" (see examples below)

## Your goal

Generate text where the model calls at least two different tools during
generation. Stretch goal: design your own tool and integrate it into your model.

## Key idea

Language models can recognise special tokens that trigger external actions.
Instead of sampling the next word, the model pauses, calls a tool, and
incorporates the result before continuing.

## Setting up tools

Before generation, designate people or objects as tools. Each tool has:

- a **trigger word** that appears in your model's vocabulary
- a **capability** (what it can do)
- a **return format** (what it gives back)

### Example tools

| Trigger word | Tool                      | Capability                     | Returns                  |
| ------------ | ------------------------- | ------------------------------ | ------------------------ |
| `VOTE`       | the room                  | ask a yes/no question          | "yes" or "no" (majority) |
| `POLL`       | show of hands             | ask a multiple-choice question | the winning option       |
| `LOOKUP`     | someone with a phone      | search for a fact              | a short answer           |
| `CALCULATE`  | someone with a calculator | do arithmetic                  | a number                 |
| `TIME`       | a clock or watch          | check the current time         | the time                 |
| `COLOUR`     | a physical object         | observe something              | a colour word            |
| `ASK`        | a designated expert       | answer a domain question       | a short phrase           |

## Algorithm

1. Add trigger words to your model's vocabulary (new rows and columns).
2. Train or manually add counts so trigger words can appear in generation.
3. During generation, when you sample a trigger word:
   - pause generation
   - formulate a question or request based on context
   - the tool "executes" and returns a result
   - write down the result as the next word(s)
   - continue generation from there

## Example session

Model trained on: "The answer is VOTE. We should CALCULATE the total."

Generation with tools:

1. Start with "The"
2. Sample → "answer"
3. Sample → "is"
4. Sample → `VOTE` (trigger!)
   - Pause. Ask the room: "Should we continue?"
   - Room votes: majority says "yes"
   - Write down "yes"
5. Sample from "yes" row → "."
6. Continue: "We" → "should" → `CALCULATE` (trigger!)
   - Pause. Ask: "What is 7 times 8?"
   - Calculator person says: "56"
   - Write down "56"
7. Sample from "56" row (if it exists) or treat as end

**Generated text:** "The answer is yes. We should 56"

(The grammar breaks down, but that's fine---the point is demonstrating the
mechanism.)

## Designing good tool triggers

For the activity to work well:

- add trigger words to rows where they make sense contextually (e.g., `VOTE`
  after "is" or "the")
- keep tool responses short (one or two words) so generation can continue
- have the tool operator ready before you start generating

## Instructor notes

### Discussion questions

- when should a model use a tool vs try to answer itself?
- what happens if a tool returns something unexpected?
- how does the model "know" to call a tool? (it doesn't---it just samples the
  trigger word)
- what tools would be most useful for different kinds of text?
- could a tool's response change what the model generates next?

### Classroom variations

**Simple version:** use just one tool (VOTE) and have the whole class
participate. The model generates until it hits VOTE, then you ask a question and
count hands.

**Advanced version:** set up multiple tools around the room. Different students
operate different tools. The generator doesn't know which tool will be called
next.

**Adversarial version:** the tool operators can return unhelpful or surprising
answers. How does this affect the generated text?

### Connection to current LLMs

Tool use (also called "function calling") is how modern AI assistants perform
actions in the world:

- **mechanism**: LLMs learn special tokens that signal "call this tool now",
  exactly like your trigger words
- **examples**: web search, code execution, API calls, database queries, image
  generation
- **agentic AI**: systems that can plan and execute multi-step tasks by chaining
  tool calls
- **JSON formatting**: modern models output structured tool calls (function
  name, parameters) rather than just trigger words

The key insight: the model doesn't "know" anything the tool returns---it just
learns when to ask. Your classroom tools demonstrate this perfectly: the model
samples VOTE not because it knows the answer, but because the training data
included VOTE in that context. The actual knowledge comes from outside the
model.

This is why tool-using AI can do things like search the web for current
information, run calculations it couldn't do in its head, or control robots and
software. The model's job is to know _when_ to call a tool and _how_ to use the
result---not to contain all knowledge itself.
