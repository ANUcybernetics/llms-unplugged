---
id: task-021
title: "Fix teaching module layout: image left with golden rule and logo overlay"
status: To Do
assignee: []
created_date: "2025-09-26 14:10"
labels: []
dependencies: []
---

## Problem

The teaching modules in `/docs/modules/` currently have a layout issue where module images either:
- Show on the right side but hide the golden rule and ANU logo, OR
- Allow the golden rule and logo to be visible but cause the image to disappear

We need both the module image AND the ANU template elements (golden rule + logo) to be visible simultaneously.

## Goal

Modify the teaching module layout so that:
1. Module images appear on the LEFT side of the first page (not right)
2. The golden rule (vertical gold line) remains visible ON TOP of the image
3. The ANU logo remains visible ON TOP of the image
4. Proper layering ensures all elements are visible with correct z-ordering

## Acceptance criteria

### Technical requirements
- [ ] Images positioned on LEFT side of first page
- [ ] Golden rule (vertical gold line) visible and overlaying the image
- [ ] ANU logo visible and overlaying the image
- [ ] Solution works with ANU template `@local/anu-typst-template:0.2.0`
- [ ] Layout preserved across all existing module files

### Testing requirements
- [ ] Compile test module: `typst compile 03-trigram.typ test-output.pdf`
- [ ] **CRITICAL**: Visually verify the generated PDF shows ALL THREE elements:
  - Module image on left side ✓
  - Golden rule visible on top of image ✓
  - ANU logo visible on top of image ✓
- [ ] Test with at least 2 other module files to confirm consistency
- [ ] Verify no regression in text layout or readability

## Implementation notes

- Work with the ANU template system rather than against it
- Consider z-index/layering properties in Typst
- May need to adjust image positioning, transparency, or masking
- Ensure changes don't break the template's responsive behaviour

## Definition of done

Task is complete only when:
1. PDF compilation succeeds without errors
2. **Visual inspection confirms all three elements are visible simultaneously**
3. Layout works consistently across multiple module files
4. No degradation in text readability or template branding

**Note**: Success requires actual PDF viewing, not just successful compilation.