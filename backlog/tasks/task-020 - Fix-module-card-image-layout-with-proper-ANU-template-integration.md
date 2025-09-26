---
id: task-020
title: Fix module card image layout with proper ANU template integration
status: To Do
assignee: []
created_date: "2025-09-26 01:50"
labels: []
dependencies: []
---

## Description

The module cards in docs/modules/\*.typ need a proper layout where:

1. An image appears on the LEFT side of the page (11.9cm wide) as a full-bleed
   background element
2. The image must be BEHIND the ANU template's gold vertical rule and logo
3. Content (including title/subtitle) flows to the RIGHT of the image with
   appropriate padding
4. The image should appear on the FIRST page, not on subsequent pages

## Current issues

- When using the ANU template's show rule with custom page-settings, the image
  appears on page 3 instead of page 1
- The ANU template creates empty title pages when title="" is passed
- Manual styling breaks the proper template integration

## Proposed solution to explore

- Use the ANU template properly but with page margins set to 0 for the first
  page
- Apply padding/margins to the text content manually rather than at the page
  level
- This might avoid the hackery of negative dx/dy positioning
- Could use a "full-bleed image layout" or "asymmetric layout with edge-to-edge
  image" approach (common in magazine/editorial design)

## Technical notes

- The layout style is commonly called "full-bleed image with text wrap" or
  "edge-to-edge image with content offset"
- Similar to magazine spreads where images extend to page edges while text
  maintains safe margins
- The z-ordering (layering) needs to be: background → image → gold rule → logo →
  content

## Files affected

- docs/modules/utils.typ (the layout functions)
- All docs/modules/\*.typ files that use the layout
