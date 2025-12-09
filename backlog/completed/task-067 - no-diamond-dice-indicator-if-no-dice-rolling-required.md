---
id: task-067
title: no diamond dice indicator if no dice rolling required
status: Done
assignee: []
created_date: '2025-12-04 23:11'
updated_date: '2025-12-04 23:14'
labels: []
dependencies: []
---

In cli/book.typ there are "diamond" indicators added to indicate how many dice
to roll.

However, if there's only one follower then no dice rolling is required; don't
show any diamonds in this case. Update the instructions (earlier in that file)
if necessary.
