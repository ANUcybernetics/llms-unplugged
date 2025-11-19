---
id: task-5
title: Create Eleventy plugin to expose markdown sources via llms.txt
status: Done
assignee: []
created_date: '2025-11-18 06:32'
updated_date: '2025-11-18 06:44'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a custom Eleventy plugin that implements the llms.txt standard for the site by:

1. Copying all source markdown files to the build output at corresponding paths with .md extension (e.g., src/index.md → _site/index.md)
2. Generating an llms.txt file at the root of the build output that follows the llms.txt specification (https://llmstxt.org/)
3. Listing all exposed markdown files in the llms.txt with appropriate metadata

The plugin should:
- Use Eleventy's event system (likely `eleventy.after`) to copy markdown files after the build
- Generate llms.txt with proper structure: H1 site name, blockquote summary, and H2 sections listing markdown resources
- Handle the site's current structure (markdown files in src/ directory)
- Integrate with the existing eleventy.config.js without requiring a separate config file

This enables LLMs to access the original markdown content for training/context purposes while maintaining the existing HTML build output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Markdown source files are copied to _site/ directory with .md extension at corresponding paths
- [x] #2 llms.txt file is generated at _site/llms.txt following the specification
- [x] #3 llms.txt contains proper structure with site name, summary, and file listings
- [x] #4 Plugin integrates cleanly into eleventy.config.js
- [x] #5 Build process completes successfully with plugin enabled
- [x] #6 Existing tests continue to pass
<!-- AC:END -->
