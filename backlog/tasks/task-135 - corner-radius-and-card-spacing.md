---
id: TASK-135
title: corner radius and card spacing
status: Done
assignee: []
created_date: '2026-07-16 04:29'
updated_date: '2026-07-16 11:28'
labels: []
dependencies: []
---

Some of the cards have square corners, some (e.g. the 'three ways in') still have rounded ones. It might be to do with recent changes in the theme package where corner radius was made a css variable.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dogfooded with agent-browser. Root cause: the ANU brand layer sets --at-border-radius: 0 (square) and all theme components follow it, but site-local chrome hard-coded radii from 0.25rem to 0.75rem (homepage hero buttons and ways-in cards, UpcomingSessions panel, glossary popover, variant toggle, TypstCompiler form, 404 link, module key-idea callout). All now route through var(--at-border-radius), so the whole site follows the brand token --- flipping to rounded site-wide is a one-line token override in global.css if ever wanted. Deck-shared widget styles and deliberate pills (Timer, CopyButton) left alone. Card spacing: .at-card-grid shipped with no block margin so grids hugged the surrounding prose on /lessons/ and /modules/; added margin-block: var(--at-spacing-xl) in global.css. Committed as f6a63b62.
<!-- SECTION:NOTES:END -->
