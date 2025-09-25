---
id: task-016
title: Refactor module layout - single column template with image support
status: Done
assignee: []
created_date: "2025-09-25 00:30"
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

## Objective

Refactor the module template and individual module files to support:

1. Single-column layout by default (still landscape)
2. Large image (40% width) on first page that extends to edge
3. Individual modules control their own 2-column sections from "Algorithm"
   onwards

## Current State

- `module-card` template in `docs/modules/utils.typ` has hardcoded 2-column
  layout
- Individual module files have no control over their layout
- 03-trigram.typ shows evidence of attempting explicit column control

## Implementation Tasks

### 1. Modify module-card template to single-column

- **File**: `docs/modules/utils.typ`
- Remove `columns: 2` from `set page()` line 6
- Keep `flipped: true` for landscape orientation

### 2. Add image parameter and first-page layout

- **File**: `docs/modules/utils.typ`
- Add `image: none` parameter to `module-card` function
- Create first-page layout: title/subtitle (60%) + image (40%)
- Image should extend to page edge

### 3. Create column-section helper function

- **File**: `docs/modules/utils.typ`
- Add `column-section` function for 2-column content
- Handles column breaks and section formatting

### 4. Update 03-trigram.typ as test case

- Remove manual `#pagebreak()` on line 28
- Wrap Algorithm sections in `#column-section[]`
- Verify existing `#colbreak()` calls work

### 5. Update remaining module files

- Files: 00-weighted-randomness.typ through 06-sampling-strategies.typ
  (except 03)
- Identify Algorithm section transitions
- Wrap algorithmic content in `#column-section[]`
- Preserve existing column breaks

### 6. Test all modules compile

- Compile each module individually
- Verify first pages render as single-column
- Verify Algorithm sections render as 2-column
- Check tables and grids maintain formatting
<!-- SECTION:DESCRIPTION:END -->
