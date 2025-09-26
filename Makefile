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
$(PDF_DIR)/%.pdf $(PDF_DIR)/%.stamp: build_books.py book.typ $(TOOL)
	$(eval FULLNAME := $(notdir $(basename $@)))
	$(eval BASE := $(shell echo $(FULLNAME) | sed 's/-[0-9]*-[0-9]*$$//' ))
	./build_books.py $(FULLNAME) data/$(BASE).txt
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Generate a YAML summary of all PDFs
.PHONY: summary
summary:
	@echo "# Generated booklets" > $(OUT_DIR)/summary.yaml
	@echo "# Generated: $$(date)" >> $(OUT_DIR)/summary.yaml
	@echo "" >> $(OUT_DIR)/summary.yaml
	@for pdf in $(PDF_DIR)/*.pdf; do \
		if [ -f "$$pdf" ]; then \
			filename=$$(basename "$$pdf"); \
			info=$$(pdfinfo "$$pdf" 2>/dev/null); \
			title=$$(echo "$$info" | grep "^Title:" | sed 's/^Title:[[:space:]]*//' | sed 's/[[:space:]]*$$//'); \
			subtitle=$$(echo "$$info" | grep "^Subject:" | sed 's/^Subject:[[:space:]]*//' | sed 's/[[:space:]]*$$//'); \
			pages=$$(echo "$$info" | grep "^Pages:" | awk '{print $$2}'); \
			if [ -z "$$title" ]; then title="(untitled)"; fi; \
			if [ -z "$$subtitle" ]; then subtitle="(no subtitle)"; fi; \
			if [ -z "$$pages" ]; then pages="0"; fi; \
			echo "- title: \"$$title\"" >> $(OUT_DIR)/summary.yaml; \
			echo "  subtitle: \"$$subtitle\"" >> $(OUT_DIR)/summary.yaml; \
			echo "  filename: $$filename" >> $(OUT_DIR)/summary.yaml; \
			echo "  num_pages: $$pages" >> $(OUT_DIR)/summary.yaml; \
			echo "" >> $(OUT_DIR)/summary.yaml; \
		fi; \
	done
	@cat $(OUT_DIR)/summary.yaml

# Clean target to remove entire output directory
.PHONY: clean
clean:
	rm -rf $(OUT_DIR)
