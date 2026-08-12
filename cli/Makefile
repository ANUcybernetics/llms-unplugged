# Makefile for building N-gram models and booklets

# Define directories
OUT_DIR := out
PDF_DIR := $(OUT_DIR)/pdf
JSON_DIR := $(OUT_DIR)/json
DATA_DIR := ../data
CUTOUTS_DIR := ../website/public/assets/pdfs/cutouts
SHEETS_DIR := ../website/public/assets/pdfs/sheets

# ===== Target specification =====
# Format: name-n-books
# - Single book (books=1): use .pdf extension
#   e.g., frankenstein-2-1.pdf
# - Multiple books (books>1): use .stamp extension
#   e.g., frankenstein-4-3.stamp
#   This will generate frankenstein-4-3-book1.pdf, frankenstein-4-3-book2.pdf, etc.

TARGETS := \
	$(PDF_DIR)/a-christmas-carol-2-1.pdf \
	$(PDF_DIR)/carol-lyrics-2-1.pdf \
	$(PDF_DIR)/cloudstreet-2-1.pdf \
	$(PDF_DIR)/frankenstein-2-1.pdf \
	$(PDF_DIR)/picnic-at-hanging-rock-2-1.pdf \
	$(PDF_DIR)/my-brilliant-career-2-1.pdf \
	$(PDF_DIR)/frankenstein-3-2.stamp \
	$(PDF_DIR)/frankenstein-4-3.stamp \
	$(PDF_DIR)/collected-hemingway-2-2.stamp \
	$(PDF_DIR)/TinyStories-20k-3-3.stamp

WORKSHOP_TARGETS := \
	$(PDF_DIR)/the-old-man-and-the-sea-2-1.pdf \
	$(PDF_DIR)/beatles-2-1.pdf \
	$(PDF_DIR)/communist-manifesto-2-1.pdf \
	$(PDF_DIR)/TinyStories-1k-2-1.pdf \
	$(PDF_DIR)/dickinson-poems-2-1.pdf

# The booklets published at website/public/assets/pdfs/booklets/. Keep this
# list in step with what that directory holds: jiangnan is only linked from a
# news post rather than the tools page, and going missing from here is how it
# came to be the one booklet nobody could rebuild.
EXAMPLE_TARGETS := \
	$(PDF_DIR)/the-cat-in-the-hat-2-1.pdf \
	$(PDF_DIR)/green-eggs-and-ham-2-1.pdf \
	$(PDF_DIR)/frankenstein-2-1.pdf \
	$(PDF_DIR)/collected-hemingway-2-1.pdf \
	$(PDF_DIR)/a-christmas-carol-2-1.pdf \
	$(PDF_DIR)/beatles-2-1.pdf \
	$(PDF_DIR)/jiangnan-2-1.pdf

# Pre-prepared cutout PDFs served from the website's tools page. All are
# bigram (n=2), duplex, and post-processed with qpdf to rotate even pages
# 180° so they print correctly with long-edge binding (the default duplex
# mode on most printers — see the cutouts-print mise task for the same
# pipeline applied ad-hoc).
CUTOUTS_TARGETS := \
	$(CUTOUTS_DIR)/green-eggs-and-ham.pdf \
	$(CUTOUTS_DIR)/where-is-the-green-sheep.pdf \
	$(CUTOUTS_DIR)/were-going-on-a-bear-hunt.pdf

# Pre-prepared search-sheet PDFs (the cutouts activity minus the cutting).
# Named for the corpus alone: every set prints at the same density, so how many
# sheets one holds is however many that corpus needs, and a longer text simply
# makes a bigger set. The count is in the brief on the front page.
SHEETS_TARGETS := \
	$(SHEETS_DIR)/green-eggs-and-ham.pdf \
	$(SHEETS_DIR)/peter-rabbit.pdf \
	$(SHEETS_DIR)/the-cat-in-the-hat.pdf \
	$(SHEETS_DIR)/the-cat-in-the-hat-2up-a4.pdf \
	$(SHEETS_DIR)/australia.pdf

# Cat in the Hat remains legible when reduced to A5 for the two-up handout,
# provided its source sheets use fewer rows and larger type. Keep this local to
# that corpus: applying the same density to the much wordier Australia corpus
# more than doubles its participant count.
SHEETS_EXTRA_ARGS_the-cat-in-the-hat := --rows 15 --font-size 19.2pt

# Define common variables (typst comes from mise; TYPST_BIN overridable)
TOOL := target/release/llms_unplugged
TYPST_BIN ?= typst

# The brand assets the templates load. Listed as prerequisites everywhere a
# template is, because make cannot see through `image()`: without them a
# regenerated lockup left every committed PDF untouched and looking current.
# The sheet header cycles the five per-token lockups, so all of them are
# inputs; `wildcard` rather than a list, because the set is the generator's to
# decide (website/scripts/generate-logo-svgs.ts) and a hand-kept list here
# would silently stop covering a sixth.
BRAND_ASSETS := $(wildcard lockup-light*.svg)

# Typst stamps a creation date into every PDF, so an unchanged rebuild still
# produces different bytes. The sheet PDFs are committed, so that would dirty
# four megabyte-sized binaries in git on every `make sheets`. Pinning the epoch
# makes a rebuild byte-identical unless the content actually changed; override
# it if you want a real date in the document properties.
# https://reproducible-builds.org/specs/source-date-epoch/
SOURCE_DATE_EPOCH ?= 0

# Track Rust source files for automatic rebuilding
RUST_SOURCES := $(wildcard src/*.rs) Cargo.toml Cargo.lock

# Ensure output directories exist
$(shell mkdir -p $(PDF_DIR) $(JSON_DIR))

# Build the release version when any Rust source changes
$(TOOL): $(RUST_SOURCES)
	cargo build --release

# ===== Generic pattern rules =====

# Generic rule for all n-gram book configurations; the CLI's --target flag
# parses the full name-n-books target to extract n and books
$(PDF_DIR)/%.pdf $(PDF_DIR)/%.stamp: book.typ $(TOOL)
	$(eval FULLNAME := $(notdir $(basename $@)))
	$(eval BASE := $(shell echo $(FULLNAME) | sed 's/-[0-9]*-[0-9]*$$//' ))
	SOURCE_DATE_EPOCH=$(SOURCE_DATE_EPOCH) TYPST_BIN=$(TYPST_BIN) $(TOOL) pdf --target $(FULLNAME) --input $(DATA_DIR)/$(BASE).txt --out-dir $(OUT_DIR) --book-binding
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# ===== Pattern rule for pre-prepared cutout PDFs =====
# The cutouts subcommand always writes to <output-dir>/cutouts.pdf, so each
# target uses its own work dir under $(OUT_DIR)/cutouts/<name>/ and qpdf
# rotates even pages 180° on the way to the final destination. That rotation
# pass preserves the object streams the CLI already packed the file into, and
# takes the same epoch and deterministic ID as the sheets, so a rebuild of an
# unchanged corpus doesn't dirty a megabyte of git.
$(CUTOUTS_DIR)/%.pdf: tokenized-cutouts.typ cutout-common.typ $(BRAND_ASSETS) $(TOOL)
	$(eval NAME := $(notdir $(basename $@)))
	$(eval WORK_DIR := $(OUT_DIR)/cutouts/$(NAME))
	mkdir -p $(WORK_DIR)
	SOURCE_DATE_EPOCH=$(SOURCE_DATE_EPOCH) TYPST_BIN=$(TYPST_BIN) $(TOOL) cutouts --input $(DATA_DIR)/$(NAME).txt --output $(WORK_DIR) -n 2 --duplex
	qpdf $(WORK_DIR)/cutouts.pdf --rotate=180:1-z:even --deterministic-id $@

# ===== Pattern rule for pre-prepared search-sheet PDFs =====
# The sheets subcommand always writes to <output-dir>/sheets.pdf, so each target
# gets its own work dir. The target name is the corpus name, and no --sheets is
# passed: the count follows from the corpus at the default density. Single-sided
# portrait, so unlike the cutouts there is no qpdf rotation step. The seed is
# pinned so rebuilding a published PDF re-deals it identically instead of
# producing a gratuitously different file.
$(SHEETS_DIR)/%.pdf: tokenized-sheets.typ cutout-common.typ $(BRAND_ASSETS) $(TOOL)
	$(eval NAME := $(notdir $(basename $@)))
	$(eval WORK_DIR := $(OUT_DIR)/sheets/$(NAME))
	mkdir -p $(WORK_DIR) $(SHEETS_DIR)
	SOURCE_DATE_EPOCH=$(SOURCE_DATE_EPOCH) TYPST_BIN=$(TYPST_BIN) $(TOOL) sheets --input $(DATA_DIR)/$(NAME).txt --output $(WORK_DIR) -n 2 --seed 42 $(SHEETS_EXTRA_ARGS_$(NAME))
	cp $(WORK_DIR)/sheets.pdf $@

# Put consecutive portrait pages side-by-side at exact A5 size on A4
# landscape. An odd final page leaves the right-hand half blank.
$(SHEETS_DIR)/the-cat-in-the-hat-2up-a4.pdf: two-up.typ $(SHEETS_DIR)/the-cat-in-the-hat.pdf
	SOURCE_DATE_EPOCH=$(SOURCE_DATE_EPOCH) $(TYPST_BIN) compile --root .. \
		--input source=$(SHEETS_DIR)/the-cat-in-the-hat.pdf \
		--input pages=$$(qpdf --show-npages $(SHEETS_DIR)/the-cat-in-the-hat.pdf) \
		two-up.typ $@

# ===== One-off: ANU Visionaries Showcase, 15 Aug 2026 (backlog TASK-140) =====
# Not a published set. It stays under $(OUT_DIR) --- which is gitignored, as
# are two of its three corpora --- because the talk withholds the sources until
# after the room has generated from them, and a set on the website would give
# that away to anyone who looked.
#
# Both the input order and the seed are load-bearing: the deal is reproducible
# only from this exact combination, so a reprint matches the copies already in
# the hall. --title and --author are what keep the sources off the page; the
# brief prints whatever the corpus metadata says, and joined real titles would
# spoil the reveal on the first sheet handed out.
SHOWCASE_DIR := $(OUT_DIR)/sheets/visionaries-showcase
SHOWCASE_SHEETS := 120
SHOWCASE_INPUTS := \
	--input $(DATA_DIR)/the-cat-in-the-hat.txt \
	--input $(DATA_DIR)/the-old-man-and-the-sea-excerpt.txt \
	--input $(DATA_DIR)/the-tell-tale-heart.txt

# 120 sheets at the Cat in the Hat density. Pinning --sheets makes the count
# the participant count rather than something the corpus decides, and 120 is
# chosen so the set doubles cleanly into a 200-seat hall: printed twice, every
# token pair is held by two people, so the proportions are unchanged and one
# empty seat no longer takes a pair out of the room.
#
# 19.2pt is the largest size that still fits most pairs in one of four columns
# on A4. Past it, wide pairs start taking two column slots each and the sheet
# count runs away --- 21pt needs 195 sheets for the same corpus, 24pt needs
# 196 even after dropping to three columns.
$(SHOWCASE_DIR)/sheets.pdf: tokenized-sheets.typ cutout-common.typ $(BRAND_ASSETS) $(TOOL)
	mkdir -p $(SHOWCASE_DIR)
	SOURCE_DATE_EPOCH=$(SOURCE_DATE_EPOCH) TYPST_BIN=$(TYPST_BIN) $(TOOL) sheets \
		$(SHOWCASE_INPUTS) --output $(SHOWCASE_DIR) -n 2 \
		--sheets $(SHOWCASE_SHEETS) --rows 15 --font-size 19.2pt --seed 42 \
		--title "Ben Swift/ANU Visionaries Showcase" --author "three authors"

# The brief is for the lectern and never goes into the handout stack, so it
# comes off the front. Its length is whatever the brief runs to for this
# corpus, so it is counted back from the end rather than hard-coded --- editing
# the brief must not silently start slicing sheets off.
$(SHOWCASE_DIR)/brief.pdf: $(SHOWCASE_DIR)/sheets.pdf
	qpdf $< --pages . 1-$$(($$(qpdf --show-npages $<) - $(SHOWCASE_SHEETS))) -- \
		--deterministic-id $@

$(SHOWCASE_DIR)/participants.pdf: $(SHOWCASE_DIR)/sheets.pdf
	qpdf $< --pages . $$(($$(qpdf --show-npages $<) - $(SHOWCASE_SHEETS) + 1))-z -- \
		--deterministic-id $@

# Handed out at full A4, not imposed two-up onto A5. The imposition halves the
# paper but it also scales the page by 1/sqrt(2), which takes 19.2pt type down
# to an effective 13.6pt --- and the sheets are read at arm's length, in a
# darkened hall, by people who have never seen one before. Getting that back
# through the imposition would need ~27pt source and over 250 sheets, so A4 is
# both the biggest type and the smallest sheet count. It costs paper, and only
# paper. two-up.typ still imposes the Cat in the Hat handout, where the sheets
# are read at a table.
.PHONY: showcase
showcase: $(SHOWCASE_DIR)/brief.pdf $(SHOWCASE_DIR)/participants.pdf
	@echo "Showcase set: $(SHOWCASE_DIR)"
	@echo "  brief.pdf           --- A4, for the lectern. Not handed out."
	@echo "  participants.pdf    --- A4, print twice: $(SHOWCASE_SHEETS) x 2 sheets"

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Build workshop booklets
.PHONY: workshop
workshop: $(WORKSHOP_TARGETS)
	@echo "Workshop booklets complete!"

# Build example booklets (single books for demos)
.PHONY: examples
examples: $(EXAMPLE_TARGETS)
	@echo "Example booklets complete!"

# Regenerate the pre-prepared cutout PDFs served from the website
.PHONY: cutouts
cutouts: $(CUTOUTS_TARGETS)
	@echo "Pre-prepared cutout PDFs complete!"

# Regenerate the pre-prepared search-sheet PDFs
.PHONY: sheets
sheets: $(SHEETS_TARGETS)
	@echo "Pre-prepared search-sheet PDFs complete!"

# Generate summary PDF from all models
.PHONY: summary
summary: $(OUT_DIR)/summary.pdf

$(OUT_DIR)/summary.pdf: summary.typ $(OUT_DIR)/summary.json
	$(TYPST_BIN) compile summary.typ $@

# Generate summary.json from all JSON models
.PHONY: summary.json
summary.json: $(OUT_DIR)/summary.json

$(OUT_DIR)/summary.json: $(wildcard $(JSON_DIR)/*.json)
	@echo "Generating summary.json from model files..."
	@echo '[' > $@.tmp
	@first=true; \
	for json in $(JSON_DIR)/*.json; do \
		[ -f "$$json" ] || continue; \
		if [ "$$first" = true ]; then \
			first=false; \
		else \
			echo ',' >> $@.tmp; \
		fi; \
		jq '.metadata | {title, n, total_tokens: .stats.total_tokens, unique_previous_words: .stats.unique_ngrams, most_common_ngram: .stats.most_common_ngram, most_popular_previous_words: .stats.most_popular_previous_words}' \
			"$$json" >> $@.tmp; \
	done
	@echo ']' >> $@.tmp
	@jq 'unique_by({title, n})' $@.tmp > $@
	@rm $@.tmp
	@echo "Summary written to $@"

# Clean target to remove entire output directory
.PHONY: clean
clean:
	rm -rf $(OUT_DIR)
