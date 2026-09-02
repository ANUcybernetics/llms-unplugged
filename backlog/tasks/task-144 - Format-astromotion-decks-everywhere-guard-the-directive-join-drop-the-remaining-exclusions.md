---
id: TASK-144
title: >-
  Format astromotion decks everywhere: guard the directive join, drop the
  remaining exclusions
status: To Do
assignee: []
created_date: '2026-09-02 07:03'
updated_date: '2026-09-02 07:18'
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
- [ ] #7 llms-unplugged: the inline HTML in src/decks/partials/ is rewritten so oxfmt is a fixed point that renders identically -- today reflowing it moves block elements inside inline ones (<p> inside <span>, doubled </p></p>), which is invalid nesting
- [ ] #8 benswift-me: the inline <ul> in phd-offsite-2026/slides.deck.mdx renders as a tight list again, or is accepted as loose deliberately

Third hazard, not in the original writeup: oxfmt reflowing inline JSX/HTML children changes MDX block-vs-inline parsing. The reflowed output is STABLE, so oxfmt-helix's two-pass fixed-point check cannot see it, and a per-file textual heuristic does not separate the safe decks from the unsafe ones (the offending HTML is in partials, not the deck). This is the strongest argument for AC #1: astromotion erroring is the only reliable guard.

Live footgun to be aware of: oxfmt-helix runs with the GLOBAL ~/.dotfiles/oxfmtrc.json and a synthetic --stdin-filepath, so a repo's ignorePatterns do NOT apply on save. With astromotion-deck now auto-format = true in Helix, saving an llms-unplugged deck or partial in Helix will reflow it and break the markup until AC #1 or #7 lands. It shows up in git diff rather than being wholly silent, but nothing fails the build.

- [ ] #9 astro-theme-university: the docs deck keeps its fenced markdown examples intact -- oxfmt currently formats inside the fence and joins two separate background-image example lines into one, changing what the docs teach
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

Done: comp4020-website (f639ba5, 13 decks, rendered HTML verified byte-identical once whitespace is collapsed), benswift-me (d45567a70, 18 of 19 decks identical plus the 26-pair adjacency fix), astro-theme-anu (5c789e1, decks were already fixed points so nothing reflowed), and the wrapper side in ~/.dotfiles (21fd46b3).

Not done, and why. llms-unplugged was attempted and REVERTED: all 10 decks changed rendering, and the change is invalid HTML nesting -- a block element hoisted inside an inline one, and doubled closing paragraph tags -- because oxfmt reflows the inline HTML in the @included partials and MDX then reparses those children as blocks. astro-theme-university was skipped for the fenced-example problem in AC #9. comp4020/templates needs nothing: it has no .oxfmtrc.json.

Third hazard, absent from the original writeup: oxfmt reflowing inline JSX/HTML children changes MDX block-vs-inline parsing. The reflowed output is STABLE, so the two-pass fixed-point check in oxfmt-helix cannot see it, and a per-file textual heuristic does not separate safe decks from unsafe ones (the offending HTML lives in the partials, not the deck that includes them). This is the strongest argument for AC #1: astromotion erroring is the only reliable guard.

Footgun to know about meanwhile: oxfmt-helix runs with the global ~/.dotfiles/oxfmtrc.json and a synthetic --stdin-filepath, so a repo's ignorePatterns do NOT apply on save. With astromotion-deck now auto-format = true in Helix, saving an llms-unplugged deck or partial in Helix will reflow it and break the markup until AC #1 or #7 lands. It shows up in git diff rather than being wholly silent, but nothing fails the build.

benswift-me detail for AC #8: the phd-offsite schedule slides went from a tight to a loose list, which decks:check still passes (all 182 slides fit).
<!-- SECTION:NOTES:END -->
