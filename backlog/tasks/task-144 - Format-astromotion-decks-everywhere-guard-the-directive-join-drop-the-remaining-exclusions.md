---
id: TASK-144
title: >-
  Format astromotion decks everywhere: guard the directive join, drop the
  remaining exclusions
status: To Do
assignee: []
created_date: '2026-09-02 07:03'
updated_date: '2026-09-02 07:03'
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
- [ ] #1 astromotion fails the build with file and line when a slide directive appears as an inline MDX expression (two directives folded onto one line), instead of silently dropping the class and id
- [ ] #2 The astromotion change is released as a tagged version and propagated to every consumer via the pinned git tag (ben:anu-theme-sync)
- [ ] #3 benswift-me: the 26 adjacent directive pairs in src/decks/phd-offsite-2026/slides.deck.mdx are separated by a blank line, and the deck still renders with every _class and _id applied
- [ ] #4 Deck exclusions are gone from .oxfmtrc.json in benswift-me, llms-unplugged, astro-theme-anu, astro-theme-university and comp4020/templates, and each repo's decks are an oxfmt fixed point
- [ ] #5 Each repo's reflow is verified behaviour-neutral before it lands: rendered deck HTML is unchanged from the pre-reflow version once whitespace is collapsed
- [ ] #6 astromotion's own test fixtures under test/fixtures are left unformatted, since they are test inputs
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
Pattern to copy: comp4020-website f639ba5 (config + 13-deck reflow in one commit). Wrapper side already done in ~/.dotfiles 21fd46b3, which also fixed a latent macOS bug where the proseWrap:preserve fallback used GNU-only 'mktemp --suffix' and aborted under set -e.
<!-- SECTION:NOTES:END -->
