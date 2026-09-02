---
id: TASK-144
title: >-
  Format astromotion decks everywhere: guard the directive join, drop the
  remaining exclusions
status: Done
assignee: []
created_date: '2026-09-02 07:03'
updated_date: '2026-09-02 08:19'
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
- [x] #2 The astromotion change is released as a tagged version and propagated to every consumer via the pinned git tag (ben:anu-theme-sync)
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
Propagation pass 2026-09-02: astromotion v0.24.0 (13307bc) bumped and pushed in every consumer that carries a pin.

- astro-theme-university 0a440dd (pnpm-workspace.yaml override + docs/package.json; tests, lint, docs build clean)
- astro-theme-anu 0e87d46 (all three pins; example resolved 0.24.0 from its own node_modules, typecheck + example build clean)
- comp4020/website c40f7be, comp4020/templates/template-course-site 6e6d4a2
- benswift-me a77692d (19 decks, no structural violations)
- llms-unplugged dad461c1

Every build ran the new guard clean --- no folded directives anywhere in the family. slop-university carries no astromotion pin, per the impact map.

Two things surfaced, neither caused by the bump:
- benswift-me's decks:check has 5 pre-existing slide overflows (classics-to-colonialism, ltc-stem-camp, p5-hour-of-code); confirmed identical on v0.23.0.
- a leaked 'astro preview --port 4321' from llms-unplugged broke decks:check in two repos until they moved port --- astromotion's own backlog task-5.

Lint-drift check reports benswift-me on oxlint ^1.80.0 / oxfmt ^0.65.0 against a canon of ^1.79.0 / ^0.64.0. The global mise oxfmt is 0.65.0, so the canon is what is behind; realigning it is a separate one-pass sweep across the family.
<!-- SECTION:NOTES:END -->
