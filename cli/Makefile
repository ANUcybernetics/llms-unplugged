# Makefile for building N-gram models and booklets

# Define directories
OUT_DIR := out
PDF_DIR := $(OUT_DIR)/pdf
JSON_DIR := $(OUT_DIR)/json
DATA_DIR := ../data
CUTOUTS_DIR := ../website/public/assets/pdfs/cutouts

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

EXAMPLE_TARGETS := \
	$(PDF_DIR)/the-cat-in-the-hat-2-1.pdf \
	$(PDF_DIR)/green-eggs-and-ham-2-1.pdf \
	$(PDF_DIR)/frankenstein-2-1.pdf \
	$(PDF_DIR)/collected-hemingway-2-1.pdf \
	$(PDF_DIR)/a-christmas-carol-2-1.pdf \
	$(PDF_DIR)/beatles-2-1.pdf

# Pre-prepared cutout PDFs served from the website's tools page. All are
# bigram (n=2), duplex, and post-processed with qpdf to rotate even pages
# 180° so they print correctly with long-edge binding (the default duplex
# mode on most printers — see the cutouts-print mise task for the same
# pipeline applied ad-hoc).
CUTOUTS_TARGETS := \
	$(CUTOUTS_DIR)/green-eggs-and-ham.pdf \
	$(CUTOUTS_DIR)/where-is-the-green-sheep.pdf \
	$(CUTOUTS_DIR)/were-going-on-a-bear-hunt.pdf

# Define common variables (typst comes from mise; TYPST_BIN overridable)
TOOL := target/release/llms_unplugged
TYPST_BIN ?= typst

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
	TYPST_BIN=$(TYPST_BIN) $(TOOL) pdf --target $(FULLNAME) --input $(DATA_DIR)/$(BASE).txt --out-dir $(OUT_DIR) --book-binding
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# ===== Pattern rule for pre-prepared cutout PDFs =====
# The cutouts subcommand always writes to <output-dir>/cutouts.pdf, so each
# target uses its own work dir under $(OUT_DIR)/cutouts/<name>/ and qpdf
# rotates even pages 180° on the way to the final destination.
$(CUTOUTS_DIR)/%.pdf: tokenized-cutouts.typ $(TOOL)
	$(eval NAME := $(notdir $(basename $@)))
	$(eval WORK_DIR := $(OUT_DIR)/cutouts/$(NAME))
	mkdir -p $(WORK_DIR)
	TYPST_BIN=$(TYPST_BIN) $(TOOL) cutouts --input $(DATA_DIR)/$(NAME).txt --output $(WORK_DIR) -n 2 --duplex
	qpdf $(WORK_DIR)/cutouts.pdf --rotate=180:1-z:even $@

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
