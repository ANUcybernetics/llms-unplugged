---
id: TASK-129
title: 'Extension lesson: ''Pass the Conversation'' (stateless chat)'
status: To Do
assignee: []
created_date: '2026-06-11 12:06'
labels:
  - website
  - lessons
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea for a future extension lesson teaching the counterintuitive fact that chat models are stateless: ChatGPT-style systems re-send the entire chat history with every message, and the "memory" of a conversation lives in the transcript, not the model.

The existing apparatus is already 90% of the way there --- the dice and grid hold nothing between turns; the only state is the paper. This lesson makes that statelessness the star.

## Core activity: swap the operator every turn

Run a chat role-play on a sheet formatted with USER:/MODEL: role markers. One student plays the user (plain-English messages); model replies are generated with the normal grid/cutouts/booklet procedure. Each time the user sends a message, a completely fresh operator (who hasn't watched the conversation) takes over the model, handed only the sheet plus the model materials.

The beat that lands it: the user says "my name is Sam" early on, then asks something name-dependent turns later. The fresh operator has never met Sam --- but the name is on the sheet. The memory was never in the model or the operator.

## Variations

- **Truncation**: fold the top of the page over so the operator can only read the last N lines --- the model "forgets" Sam's name. Context window made literal; "new chat" is a blank sheet.
- **Edited history**: secretly rewrite one of the model's earlier replies between turns; the next operator treats it as gospel. Prefill/history-editing in one move.
- **Cost**: each fresh operator must re-read the whole sheet before generating, and re-reading time visibly grows --- why long chats get slower/more expensive per message; sets up an instructor note on KV/prompt caching.

## Fit with existing lessons

- Composes with in-context-memory (order 6, how-models-understand): pair with the memory-list mechanic so the fresh operator *rebuilds* the memory list from the last ~8 words on the page, proving the state is disposable and reconstructible from the transcript alone. This matters because a bare bigram only needs the last word --- without the memory list the full re-read is theatrical rather than algorithmically necessary. Lean into the pairing.
- Natural slot: topic how-models-understand, ordered right after In-context Memory.
- The role-marker trick quietly teaches that "chat is just formatted text completion" (chat templates) --- a bonus counterintuitive point.
- Same "adds a procedure on top of a model you already have" framing as in-context-memory; nothing new to print.

## Instructor notes should cover

- stateless APIs (every call sends full message history)
- context windows and truncation
- KV/prompt caching as "not re-reading from scratch"
- ChatGPT-style "memory" features being injected text, not model state
- discussion questions: where does ChatGPT keep your name? what does "new chat" do, physically? why does a long chat cost more per message? if history can be edited, what should you trust about "what the model said"?

Candidate titles: "Pass the Conversation" (preferred), "Stateless Chat". File: stateless-chat.mdx or similar, following house lesson format (You will need / Your goal / Key idea / Algorithm / worked example / Instructor notes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 new lesson MDX exists in website/src/content/lessons following the house format
- [ ] #2 core operator-swap activity demonstrates that conversation state lives only in the transcript
- [ ] #3 truncation and edited-history variations are included
- [ ] #4 instructor notes connect to real LLMs: stateless APIs, context windows, caching, memory features
<!-- AC:END -->
