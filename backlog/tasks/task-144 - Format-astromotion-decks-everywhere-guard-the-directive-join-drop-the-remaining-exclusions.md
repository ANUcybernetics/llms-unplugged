---
id: TASK-144
title: >-
  Format astromotion decks everywhere: guard the directive join, drop the
  remaining exclusions
status: To Do
assignee: []
created_date: '2026-09-02 07:03'
updated_date: '2026-09-02 07:55'
labels:
  - tooling
  - decks
  - astromotion
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COMP4020's website now formats its decks like any other MDX (comp4020-website f639ba5): the src/decks/ and *.deck.mdx entries came out of .oxfmtrc.json, all 13 decks reflowed, and the rendered HTML was verified byte-identical once whitespace is collapsed. The same change is still owed to every other deck repo, and the underlying footgun is still unguarded upstream.

The footgun: oxfmt folds two adjacent single-line {/* ... */} directives onto one line. MDX then reparses them as inline expressions instead of flow expressions, astromotion's _class/_id plugins stop matching, and the slide silently loses both -- no build error, no visible failure until someone notices a slide lost its layout. Confirmed on astromotion 0.21.1 and 0.23.0. A blank line between the two directives fixes it and is itself a stable oxfmt fixed point.

~/.dotfiles 21fd46b3 already handles this for Helix-on-save and the claude-format hook (oxfmt-helix normalises the adjacency before formatting, then checks the output). But a bare 'pnpm format' calls oxfmt directly and has no such guard, so the durable fix belongs in astromotion: reject the inline form instead of silently ignoring it, the way 0.23.0 already rejects the removed {/* notes: */} directive.

Scope note: the notes migration this task originally implied is already done -- llms-unplugged and benswift-me are both on astromotion v0.23.0 with fenced notes/comment blocks. What is left is the exclusions, one adjacency cleanup, and the upstream guard.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 astromotion fails the build with file and line when a slide directive appears as an inline MDX expression (two directives folded onto one line), instead of silently dropping the class and id
- [ ] #2 The astromotion change is released as a tagged version and propagated to every consumer via the pinned git tag (ben:anu-theme-sync)
- [x] #3 benswift-me: the 26 adjacent directive pairs in src/decks/phd-offsite-2026/slides.deck.mdx are separated by a blank line, and the deck still renders with every _class and _id applied
- [x] #4 Deck exclusions are gone from .oxfmtrc.json in benswift-me, astro-theme-anu, astro-theme-university and comp4020/templates, and each repo's decks are an oxfmt fixed point (llms-unplugged is TASK-145)
- [x] #5 Each repo's reflow is verified behaviour-neutral before it lands: rendered deck HTML is unchanged from the pre-reflow version once whitespace is collapsed
- [x] #6 astromotion's own test fixtures under test/fixtures are left unformatted, since they are test inputs
- [x] #7 benswift-me: the inline <ul> in phd-offsite-2026/slides.deck.mdx renders as a tight list again, or is accepted as loose deliberately
- [x] #8 astro-theme-university: the docs deck keeps its fenced markdown examples intact -- oxfmt currently formats inside the fence and joins two separate background-image example lines into one, changing what the docs teach
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. astromotion: add a parse helper that detects a slide directive (_class, _id, _animate, embed, @include) arriving as an mdxTextExpression rather than an mdxFlowExpression, and fail the build with file and line. Mirror the existing removed-notes-directive guard in src/parse-helpers.ts. Add a test asserting the inline form errors and the blank-line-separated form still applies both directives.
2. Cut an astromotion release and propagate the tag to consumers (ben:anu-theme-sync).
3. benswift-me: separate the 26 adjacent pairs in phd-offsite-2026/slides.deck.mdx with a blank line. Adjacency check:
   awk '{cur=($0 ~ /^\{\/\*.*\*\/\}$/)} NR>1 && prevdir && cur {c++} {prevdir=cur} END{print c+0}' <file>
4. Per repo (benswift-me, llms-unplugged, astro-theme-anu, astro-theme-university, comp4020/templates): capture rendered deck HTML from the dev server, drop the deck entries from .oxfmtrc.json, run pnpm format, re-capture, and compare whitespace-collapsed (tr -s '[:space:]' ' ' | md5). Identical output is the gate. Then typecheck, build and pnpm decks:check. Land the config change and the reflow as one commit, since format:check is red between them.
5. Note that the build only validates published decks -- unpublished ones need the dev server (astro dev --background, then fetch /lectures/<name>/) to be checked at all.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Progress 2026-09-02.

First pass: comp4020-website (f639ba5, 13 decks, rendered HTML verified byte-identical once whitespace is collapsed), benswift-me (d45567a70, 18 of 19 decks identical plus the 26-pair adjacency fix), astro-theme-anu (5c789e1, decks were already fixed points so nothing reflowed), and the wrapper side in ~/.dotfiles (21fd46b3). comp4020/templates needs nothing: it has no .oxfmtrc.json.

Second pass:

- astromotion 9b64ce1: remarkDeckDirectiveGuard rejects a slide directive that arrives as an inline MDX expression, naming the file and line, and remarkDeckIncludes runs the same check on each partial before the splice strips its positions --- so a fold inside a partial names the partial, not the deck. Scanned against all 103 real decks and partials across the consumer repos: no false positives.
- astro-theme-university bb51200: deck exclusions gone. The docs deck was already a fixed point apart from two prose paragraphs. The one thing the reflow broke was inside a fence --- oxfmt formats embedded markdown, and it joined two background-image examples onto one line, changing what the slide teaches. A blank line between the examples is stable under both that repo's config and the global one. Rendered HTML otherwise identical.
- astro-theme-anu 76f6223: dropped the dead **/*.deck.svx entry; no .svx file lives there any more.
- benswift-me 1383cb988: the schedule slide's hand-written <ul> is markdown lists now, which render tight. Identical to the pre-reflow build once inter-tag whitespace is collapsed.

Still open here: AC #2 only --- cutting the astromotion release and bumping the pinned tag in every consumer.

llms-unplugged is TASK-145. Its hazard is a different one: oxfmt reflowing an element's inline children changes MDX's block-vs-inline parsing, so a wrapped <p class="fragment"> ends up wrapping a <p> and the fragment class lands on an empty element. Both shapes are legal MDX, the reflowed form is a stable fixed point, and the offending markup is mostly in partials rather than the decks that include them --- so neither astromotion nor a format-check can catch it, and it needs a source change at each of the 18 sites.

Footgun while TASK-145 is open: oxfmt-helix runs with the global ~/.dotfiles/oxfmtrc.json and a synthetic --stdin-filepath, so a repo's ignorePatterns do NOT apply on save. With astromotion-deck auto-format = true in Helix, saving an llms-unplugged deck or partial reflows it and breaks the markup. It shows up in git diff rather than being wholly silent, but nothing fails the build.
<!-- SECTION:NOTES:END -->
