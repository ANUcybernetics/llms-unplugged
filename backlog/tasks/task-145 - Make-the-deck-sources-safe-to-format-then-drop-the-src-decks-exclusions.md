---
id: TASK-145
title: 'Make the deck sources safe to format, then drop the src/decks exclusions'
status: Done
assignee: []
created_date: '2026-09-02 07:54'
updated_date: '2026-09-02 08:12'
labels:
  - tooling
  - decks
  - astromotion
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The last repo still excluding its decks from oxfmt (`website/.oxfmtrc.json`: `src/decks/**/*.mdx`). TASK-144 removed the exclusions everywhere else; this repo was attempted and reverted, because reflowing these decks changes what they render.

The mechanism, which is *not* the directive-join footgun TASK-144 guarded upstream. MDX decides an element's children are block or inline from the source layout: on one line they are inline, spread over several lines they are parsed as blocks. So oxfmt wrapping a long single-line element rewrites the DOM:

- `<p class="fragment">long text</p>` becomes `<p class="fragment"><p>long text</p></p>`. A browser repairs that by closing the outer p at the inner one, leaving an EMPTY p carrying `fragment` and an unclassed p holding the text --- the fragment reveal breaks.
- `<span class="qa-prompt">text</span>` inside `<div class="qa-compare">` becomes a span wrapping a p: a block inside an inline element.
- In `unplugged-age-of-ai.deck.mdx` the reflow of a `<span>` inside a blockquote is worse still: it splits the sentence into a separate block and orphans the full stop onto its own line as `.`.

The reflowed output is a stable fixed point, so `oxfmt --check` cannot see it, and no per-file heuristic separates the safe decks from the unsafe ones (the offending markup is largely in partials, not the decks that @include them). astromotion cannot guard this one the way it now guards folded directives --- both forms are legal MDX.

Note the live footgun while this is open: oxfmt-helix runs with the global ~/.dotfiles/oxfmtrc.json and a synthetic --stdin-filepath, so this repo's ignorePatterns do NOT apply on save. Saving one of these decks or partials in Helix reflows it and breaks the markup. It shows up in git diff; nothing fails the build.

Sites (18, all under website/src/decks/):

- demystifying-large-language-models.deck.mdx:119-121 --- 3x `<p class="corpus-* fragment">` with `<br />` and a `<span>`
- visionaries-showcase.deck.mdx:207-209 --- the same three
- unplugged-age-of-ai.deck.mdx:94 and unplugged-in-the-age-of-ai.deck.mdx:100 --- `<span class="fragment quote-emph">` inside a blockquote
- partials/denouement.mdx:6-7 --- 2x `<p class="fragment">`
- partials/yr5-6-definitions.mdx:5-8 --- 4x `<p class="fragment">`
- partials/yr5-6-wrap-up.mdx:5,7,9 --- 3x `<p class="fragment">`
- partials/scaling-up.mdx:88 --- `<span class="qa-prompt">`

Everything else the reflow touches is benign and verified: self-closing components (`<StaticGeneration ... />`) gain no children, and prose/table rewrapping is the point of the exercise.

Two ways to fix it.

1. `{/* prettier-ignore */}` above each of the 18 sites. oxfmt honours it (verified), rendering stays byte-identical, no CSS work. Cost: 18 ignore comments, and a reader has to know why they are there.
2. Rewrite the markup into block form --- `<div class="fragment">` with blank lines around markdown children, the shape used for the benswift-me schedule slide (benswift-me 1383cb988). Idiomatic MDX and valid HTML, but the DOM changes from `p.fragment` to `div.fragment > p`, and theme.css keys margins and positioning on those classes (`.reveal .voice` margin-block-end, `.socy-url` absolute + margin:0, `.corpus-*` font-size), so each site needs a CSS pass and a look at the slide.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every site above survives `pnpm format` --- the decks are an oxfmt fixed point under both this repo's config and the global ~/.dotfiles/oxfmtrc.json that Helix saves with
- [x] #2 The deck entries are gone from website/.oxfmtrc.json
- [x] #3 Rendered deck HTML is verified against the pre-change build for all 10 decks: identical once inter-tag whitespace is collapsed (`sed 's/>[[:space:]]*</></g'`), or every difference is deliberate and has been looked at on the slide
- [x] #4 `pnpm decks:check` passes, and the config change and the reflow land in one commit (format:check is red between them)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Landed as abed95f9 with option 1 (prettier-ignore), chosen over the markup rewrite: two of the hazard classes cannot be rewritten into block form at all, so a rewrite would have left a mixed idiom behind anyway.

Twelve {/* prettier-ignore */} comments, not eighteen --- one comment covers a whole contiguous block, so the three corpus paragraphs (and the four yr5-6 definitions, and denouement's three) each take one. Sites: demystifying, visionaries, both unplugged blockquotes, denouement, yr5-6-definitions, yr5-6-wrap-up (3, blank-line separated), scaling-up's qa-compare.

Two sites the task did not list, and prettier-ignore does not fix them: in cutouts-combining-models.mdx and cutouts-sycophancy.mdx a <Token> starts a source line inside a prose paragraph. oxfmt parses that line as its own block and inserts a blank line before it, which splits one rendered <p> into two; the ignore comment covers a node, not the gap between nodes. Both are rewrapped so no line starts with a tag --- the paragraph text is untouched, only the newline moves.

Verification: rendered HTML for all 10 decks captured from a production build before and after. Nine are byte-identical once inter-tag whitespace is collapsed; build-break-extend differs only where the newline now falls inside those two paragraphs, and is identical once all whitespace is collapsed. pnpm check green throughout (typecheck, oxlint, stylelint, format:check, 228 tests, decks:check 449 slides all fit).

Fixed-point status: every deck and partial is a fixed point under this repo's config. Under the raw global ~/.dotfiles/oxfmtrc.json (proseWrap: always) the eleven marker-less files are fixed points too; the other thirteen would have their prose rewrapped, but oxfmt-helix never formats them --- it short-circuits any file carrying a slide directive. Ran every deck file through oxfmt-helix itself: all 39 come back unchanged, so a Helix save is safe. The task's 'live footgun while this is open' note was already stale: that passthrough predates this work.

Convention recorded in website/CLAUDE.md ('Deck source formatting') so the comments are not read as noise and removed.
<!-- SECTION:NOTES:END -->
