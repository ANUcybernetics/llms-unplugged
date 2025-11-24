# Release Notes

## Upcoming release (unversioned)

- CLI now requires explicit subcommands: `build` (JSON), `pdf` (PDF + JSON), and
  `tsv` (bigram TSV). Legacy flag-only invocation is removed.
- PDF builds mirror prior Python helper behavior (`--target name-n-books`,
  paper/column inputs, subtitles) directly in Rust; Python scripts were removed.
- Makefile in `cli/` now calls `llms_unplugged pdf` for booklet targets.
- Docs (README, AGENTS) updated to reflect the subcommand workflow.
