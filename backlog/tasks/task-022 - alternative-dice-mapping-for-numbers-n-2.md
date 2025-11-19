---
id: task-022
title: alternative dice mapping for numbers > n/2
status: Done
assignee: []
created_date: "2025-10-06 09:19"
labels: []
dependencies: []
---

In @scripts/generate*dice_mapping.py I'd like to (for all group values \_g* >
_dice max_ / 2) visually indicate that any rolls greater than _g_ should be
re-rolled (perhaps by just lowering the opacity of those ones, so they're coded
as "disabled").

For example, for a d10 any row number greater than 5 should have the right-hand
end boxes visually disabled.
