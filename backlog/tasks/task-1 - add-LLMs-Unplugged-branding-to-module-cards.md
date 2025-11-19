---
id: task-1
title: add LLMs Unplugged branding to module cards
status: Done
assignee: []
created_date: '2025-11-19 22:07'
updated_date: '2025-11-19 22:33'
labels: []
dependencies: []
---

The `logos: ("studio",)` part of utils.typ means that there's a cybernetic
studio wordmark in the bottom LH margin of the output pdfs, but I'd actually
like that to say "LLMs Unplugged | Cybernetic Studio". Currently the anu typst
template doesn't allow us to configure that text, so we'll have to think of a
nice and clean way to do it.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented by removing `logos: ("studio",)` from the ANU template config and adding custom branding directly in the page background. The text "LLMs Unplugged | Cybernetic Studio" now appears in the left margin of all module cards, matching the original positioning and styling (Neon Tubes 2 font, socy-yellow colour, rotated -90deg).
<!-- SECTION:NOTES:END -->
