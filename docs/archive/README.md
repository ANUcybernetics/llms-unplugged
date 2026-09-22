# LLMs Unplugged --- version {{version}} ({{date}})

LLMs Unplugged teaches how AI language models work by building one yourself,
with pen, paper and dice. This bundle is a dated snapshot of its tested lessons,
ready to print and teach.

The website, [www.llmsunplugged.org](https://www.llmsunplugged.org), is the
living version and always the better reference: it is kept up to date, it has
every lesson and module (not just the ones here), and it has interactive widgets
and tools a PDF can't carry. Use this bundle when you need the materials offline
or want to cite a fixed version.

Cite it as the concept DOI
[10.5281/zenodo.17403824](https://doi.org/10.5281/zenodo.17403824), which always
resolves to the latest version; `CITATION.cff` has the details.

## What's here

Each lesson directory holds its deck as two PDFs: `*-slides.pdf` to project, and
`*-presenter-guide.pdf`, which puts each slide's speaker notes on the page after
it. The printables sit beside them.

### my-first-language-model

[The classic workshop](https://www.llmsunplugged.org/lessons/my-first-language-model/)
(high school to adults): train a language model on grid paper, then roll dice to
generate new text. The three decks are the 60-minute, 90-minute and 2-hour
versions.

- `grid-worksheet.pdf` --- the grid template, one per person or pair
- `booklets/` --- pre-trained model booklets for the 90-minute and 2-hour
  versions; print one per group. The decks walk through
  `the-man-from-snowy-river.pdf`; the others are alternatives (the `-trigram`
  booklets use two words of context)

### how-ai-writes-stories

[A 90-minute primary-school lesson](https://www.llmsunplugged.org/lessons/how-ai-writes-stories/)
(years 5--6): students build paper language models from picture-book cutouts and
use them to write stories.

- `cutouts/` --- token cutouts from three picture books; print two or three
  books' worth and cut them into strips before the lesson

### how-ai-writes-stories-ledger

[The same lesson with a cup of counters](https://www.llmsunplugged.org/lessons/how-ai-writes-stories-ledger/)
(ages 10--16): groups generate stories from a finished ledger model by drawing
coloured counters, then train their own.

- `printouts/` --- everything to print, with its own `README.md` saying how many
  copies of each and which pages go to which group

### cli

Prebuilt `llms_unplugged` command-line tool, which generates booklets, cutouts,
ledgers and search sheets from any text. Unpack the archive for your platform:

- `x86_64-unknown-linux-gnu` --- Linux
- `aarch64-apple-darwin` --- macOS on Apple silicon
- `x86_64-apple-darwin` --- macOS on Intel
- `x86_64-pc-windows-msvc` --- Windows

Making PDFs also needs [Typst](https://typst.app/open-source/) on your `PATH`
(and [qpdf](https://qpdf.sourceforge.io/) for some subcommands). Run
`llms_unplugged --help` for the subcommands. The
[repository README](https://github.com/ANUcybernetics/llms-unplugged) documents
them and the input text format; the source is in the separate
`llms-unplugged-{{version}}-source.zip` deposited alongside this bundle.

## Licence

Teaching materials (the decks and printables) are licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (see
`LICENSE-CC-BY-SA-4.0`); the CLI is MIT-licensed (see `LICENSE`). (c) Ben Swift.
