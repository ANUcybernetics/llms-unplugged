# Makefile for building all targets

# Define directories
OUT_DIR := out
PDF_DIR := $(OUT_DIR)/pdf
JSON_DIR := $(OUT_DIR)/json

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
TOOL := target/release/my_first_lm
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
	./scripts/build_books.py $(FULLNAME) data/$(BASE).txt
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
	@echo '[' > $@
	@first=true; \
	for json in $(JSON_DIR)/*.json; do \
		[ -f "$$json" ] || continue; \
		basename=$$(basename "$$json" .json); \
		pdf="$(PDF_DIR)/$${basename}.pdf"; \
		if [ ! -f "$$pdf" ]; then \
			pdf=$$(echo "$$pdf" | sed 's/_book_[0-9]*\.pdf/.pdf/'); \
		fi; \
		if [ ! -f "$$pdf" ]; then \
			pdf=$$(echo "$(PDF_DIR)/$${basename}" | sed 's/-book[0-9]*/-book1/').pdf; \
		fi; \
		pages=0; \
		if [ -f "$$pdf" ]; then \
			pages=$$(pdfinfo "$$pdf" 2>/dev/null | grep "^Pages:" | awk '{print $$2}'); \
		fi; \
		[ -z "$$pages" ] && pages=0; \
		if [ "$$first" = true ]; then \
			first=false; \
		else \
			echo ',' >> $@; \
		fi; \
		jq --arg pages "$$pages" --arg pdf "$$(basename "$$pdf")" \
			'.metadata | {title, n, total_tokens: .stats.total_tokens, unique_prefixes: .stats.unique_ngrams, most_common_ngram: .stats.most_common_ngram, most_popular_prefix: .stats.most_popular_prefix, pages: ($$pages | tonumber), pdf_file: $$pdf}' \
			"$$json" >> $@; \
	done
	@echo ']' >> $@
	@echo "Summary written to $@"

# Clean target to remove entire output directory
.PHONY: clean
clean:
	rm -rf $(OUT_DIR)
