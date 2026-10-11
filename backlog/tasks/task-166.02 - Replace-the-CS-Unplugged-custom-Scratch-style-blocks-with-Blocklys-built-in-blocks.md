---
id: TASK-166.02
title: >-
  Replace the CS Unplugged custom Scratch-style blocks with Blockly's built-in
  blocks
status: To Do
assignee: []
created_date: '2026-10-11 01:07'
labels:
  - cs-unplugged
dependencies: []
parent_task_id: TASK-166
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The block-based "Plugging it in" editor on csunplugged.org uses Blockly with about 30 custom blocks that the UC team styled to look like Scratch: custom shapes, colours and wording, each with a hand-written rule that turns the block into Python. That is one 1,100-line file (upstream `static/js/custom-blockly-blocks.js`) plus a toolbox and a custom theme. The static port (TASK-166.01) carries these over unchanged for fidelity with the live site.

This task is the optional simplification: drop the custom blocks and use the print, ask, loop, if/else, maths, text and variable blocks that Blockly ships, each of which comes with a Python generator maintained by the Blockly project. It removes most of the custom editor code and the work of keeping it in step with Blockly releases. The cost is that the blocks stop looking like Scratch, which students meet in the Scratch versions of the same challenges, and that the 33 block pictures used in the challenge hints (`img/plugging-it-in/block-based-blocks/`) no longer match and need regenerating.

Only 14 challenges have a block-based version (13 in Binary numbers, one in Kidbots), and every one of them also exists as a Python challenge and a Scratch challenge.

Optional, and not to be started before the port is live and Tim Bell and the maintainers have agreed to the change in appearance. Not yet checked: whether every custom block has a built-in equivalent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tim Bell and the CS Unplugged maintainers have agreed to the blocks no longer looking like Scratch
- [ ] #2 Each custom block is mapped to a built-in Blockly block, and any without an equivalent is listed with a decision to keep it as a custom block or drop it
- [ ] #3 The upstream reference solution for each of the 14 block-based challenges, rebuilt from built-in blocks, passes its test cases in the editor
- [ ] #4 The block pictures in the challenge hints show the blocks the editor now offers
- [ ] #5 Attempts saved with the custom blocks either still load or are discarded without an error
<!-- AC:END -->
