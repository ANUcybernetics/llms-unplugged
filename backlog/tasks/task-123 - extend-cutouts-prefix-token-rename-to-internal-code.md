---
id: TASK-123
title: extend cutouts prefix/token rename to internal code
status: To Do
assignee: []
created_date: '2026-05-08 07:31'
labels:
  - refactor
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-on cleanup from commit 7e72d99, which renamed user-facing copy from 'prefix'/'token' to 'previous word'/'next word' across cutouts decks, lessons, the LmCutouts component, and the Typst cutouts instructions page. This task extends the rename into internal code names so the data model matches the pedagogy: Rust struct fields, JSON schema, Typst function/variable names, CSS classes, and TypeScript types.

## Scope to rename

- **Rust** (cli/src/lib.rs, cli/src/wasm.rs, cli/src/main.rs, cli/tests/): WordFollowEntry.prefix and .followers fields, NGramPrefix struct, prefix_label fn, local vars (prefix_str, prefix_arr, prefix_size, prefix_map), tuple destructurings of most_common_ngram / most_popular_prefix, test data
- **JSON schema**: cutouts.json 'prefix' key, summary.json most_common_ngram and most_popular_prefix shapes. Decide between (a) serde rename to keep JSON keys stable and only rename Rust-side, or (b) rename JSON keys too and update Typst readers. Apply consistently.
- **Typst** (cli/tokenized-cutouts.typ, cli/book.typ, cli/summary.typ, handouts/poster.typ): prefix-box(), prefix-noun, prefix-length, last-prefix, format-follower(), format-followers(), format-entry() and their parameters; JSON field reads (token.prefix etc.) must match whichever JSON decision was made
- **TypeScript** (website/src/lib/modelEntries.ts and consumers): ModelEntry.prefix, EntryFollower type, follower loop bindings
- **Svelte components** (PretrainedGenerationWidget, StaticPretrainedGeneration, CutoutsGenerationWidget, CutoutsTrainingWidget): .entry-prefix, .follower, .follower-word, .cutout-prefix, .cutout-text, .cutout-token CSS classes and the JS that references them
- **CSS** (website/src/styles/widgets.css, website/src/decks/theme.css): class names above. NB the --token-bg / --token-fg custom properties on theme.css are NOT in this rename — they're design tokens for the colour palette
- **Code comments** describing the renamed concepts (not historical references in commit messages or migration notes)

## Do NOT rename

- Logo system: TokenLogo.svelte, TITLE_TOKENS, tokenBits, .token-logo, .token-text — separate from cutouts
- CSS custom properties --token-bg / --token-fg — design-token names
- General tokenisation: parseTokens, normalizeWordToken, tokenColorIndex, tokenColorClass, isPunctuation — these handle individual words from any text source
- 'total_tokens' in JSON metadata, 'bits/token' entropy units, 'token cutouts' as the product name
- Rust std methods (.strip_prefix on paths)
- The NLP technical sense of 'token' (a unit emitted by the tokeniser)
- handouts/poster.typ and cli/book.typ if the dice/booklet paradigm reads more clearly with 'follower' — judgement call; lean toward unifying unless it hurts the maths/dice framing

## Reference

- Prior commit: 7e72d99
- Full survey of remaining occurrences was done in the conversation that produced this task; redo with grep -rn 'prefix\|follower' across cli/, handouts/, typst/, website/src/ if needed
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rust struct fields and local variables in cli/src/ no longer use 'prefix' or 'follower' to mean the cutouts before/after parts (excluding tokenisation context)
- [ ] #2 JSON schema decision applied consistently: either serde rename keeps existing JSON keys, or JSON keys renamed and Typst readers updated to match
- [ ] #3 Typst function names, parameters, and local variables in cli/*.typ and handouts/*.typ aligned with the new vocabulary (or kept where the dice paradigm justifies 'follower')
- [ ] #4 CSS classes (.cutout-prefix, .cutout-text, .entry-prefix, .follower, .follower-word) renamed and all consumers updated
- [ ] #5 TypeScript types in website/src/lib/ and Svelte widgets aligned
- [ ] #6 Code comments describing renamed concepts updated; logo system, design tokens, general tokenisation, and Rust std methods left alone
- [ ] #7 cd cli && cargo test passes
- [ ] #8 cd website && pnpm run build && pnpm test passes
- [ ] #9 Pre-generated cutout PDFs regenerated and committed (cli/Makefile pdf target)
- [ ] #10 Single commit (or small focused series) with a clear message referencing 7e72d99
<!-- AC:END -->
