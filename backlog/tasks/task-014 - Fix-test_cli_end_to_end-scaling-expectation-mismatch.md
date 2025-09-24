---
id: task-014
title: Fix test_cli_end_to_end scaling expectation mismatch
status: To Do
assignee: []
created_date: '2025-09-24 22:49'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The test_cli_end_to_end integration test is failing with assertion about "the" prefix total count: left: 10, right: 9.

Problem: The test expects the "the" prefix to have a total count of 10 but is getting 9. This is due to the recent change from scale_d being Option<u32> to u32 with default value 10.

Context: 
- Previously, no --scale-d flag meant "10^k-1" scaling behavior
- Now, no --scale-d flag defaults to d=10 scaling
- Test comments and expectations still reference old "10^k-1" behavior
- Line 718 in test expects total_scaled to be 9 for no-scale-arg case
- But line 451 comment says "no scaling args (default 10^k-1)" which is now incorrect

Test data analysis:
- Input: "The quick, Brown fox jumps over the lazy dog. The FOX is quick and the dog is lazy? Quick brown foxes jump! 123 456 Ignore---these words ###"
- "the" appears as prefix for: "quick", "fox", "dog", "lazy" (4 unique followers, 4 total occurrences)
- Old 10^k-1 scaling: 4 followers -> k=1, scale to 9 total
- New d=10 scaling: 4 followers <= 10, scale to [1,10] -> 10 total

Steps to fix:
1. Verify current scaling behavior with test data
2. Update test comments to reflect d=10 default instead of 10^k-1
3. Update assertion expectations:
   - Line 718: change from 9 to 10 for "the" prefix total
   - Line 735: change from 10 to ? for "quick" prefix (verify actual expected value)
4. Update other related assertions that assume 10^k-1 behavior
5. Ensure all scaling test cases reflect new d=10 default behavior
<!-- SECTION:DESCRIPTION:END -->
