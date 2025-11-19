# Makefile for building N-gram models and booklets

# Define directories
OUT_DIR := out
PDF_DIR := $(OUT_DIR)/pdf
JSON_DIR := $(OUT_DIR)/json
DATA_DIR := ../data

# ===== Target specification =====
# Format: name-n-books
# - Single book (books=1): use .pdf extension
#   e.g., frankenstein-2-1.pdf
# - Multiple books (books>1): use .stamp extension
#   e.g., frankenstein-4-3.stamp
#   This will generate frankenstein-4-3-book1.pdf, frankenstein-4-3-book2.pdf, etc.

TARGETS := \
	$(PDF_DIR)/cloudstreet-2-1.pdf \
	$(PDF_DIR)/frankenstein-2-1.pdf \
	$(PDF_DIR)/frankenstein-3-2.stamp \
	$(PDF_DIR)/frankenstein-4-3.stamp \
	$(PDF_DIR)/collected-hemingway-2-2.stamp \
	$(PDF_DIR)/TinyStories-20k-3-3.stamp

WORKSHOP_TARGETS := \
	$(PDF_DIR)/the-old-man-and-the-sea-2-1.pdf \
	$(PDF_DIR)/beatles-2-1.pdf \
	$(PDF_DIR)/communist-manifesto-2-1.pdf \
	$(PDF_DIR)/TinyStories-1k-2-1.pdf

# Define common variables
TOOL := target/release/llms_unplugged
TYPST := typst compile

# Track Rust source files for automatic rebuilding
RUST_SOURCES := $(wildcard src/*.rs) $(wildcard src/**/*.rs) Cargo.toml Cargo.lock

# Ensure output directories exist
$(shell mkdir -p $(PDF_DIR) $(JSON_DIR))

# Build the release version when any Rust source changes
$(TOOL): $(RUST_SOURCES)
	cargo build --release

# ===== Generic pattern rules using Python script =====

# Generic rule for all n-gram book configurations
# The Python script parses the full target name to extract n and books
$(PDF_DIR)/%.pdf $(PDF_DIR)/%.stamp: scripts/build_books.py book.typ $(TOOL)
	$(eval FULLNAME := $(notdir $(basename $@)))
	$(eval BASE := $(shell echo $(FULLNAME) | sed 's/-[0-9]*-[0-9]*$$//' ))
	./scripts/build_books.py $(FULLNAME) $(DATA_DIR)/$(BASE).txt
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Build workshop booklets
.PHONY: workshop
workshop: $(WORKSHOP_TARGETS)
	@echo "Workshop booklets complete!"

# Generate summary PDF from all models
.PHONY: summary
summary: $(OUT_DIR)/summary.pdf

$(OUT_DIR)/summary.pdf: summary.typ $(OUT_DIR)/summary.json
	$(TYPST) summary.typ $@

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
		jq '.metadata | {title, n, total_tokens: .stats.total_tokens, unique_prefixes: .stats.unique_ngrams, most_common_ngram: .stats.most_common_ngram, most_popular_prefix: .stats.most_popular_prefix}' \
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
