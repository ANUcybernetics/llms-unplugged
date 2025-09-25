# Makefile for building all targets

# Define directories
OUT_DIR := out

# ===== Target specification =====
# Format: name-n-books
# - Single book (books=1): use .pdf extension
#   e.g., frankenstein-2-1.pdf
# - Multiple books (books>1): use .stamp extension
#   e.g., frankenstein-4-3.stamp
#   This will generate frankenstein-4-3-book1.pdf, frankenstein-4-3-book2.pdf, etc.

TARGETS := \
	$(OUT_DIR)/cloudstreet-2-1.pdf \
	$(OUT_DIR)/frankenstein-2-1.pdf \
	$(OUT_DIR)/frankenstein-3-2.stamp \
	$(OUT_DIR)/frankenstein-4-3.stamp \
	$(OUT_DIR)/collected-hemingway-2-2.stamp \
	$(OUT_DIR)/TinyStories-20k-3-3.stamp

# Define common variables
TOOL := target/release/my_first_lm
TYPST := typst compile

# Track Rust source files for automatic rebuilding
RUST_SOURCES := $(wildcard src/*.rs) $(wildcard src/**/*.rs) Cargo.toml Cargo.lock

# Ensure output directory exists
$(shell mkdir -p $(OUT_DIR))

# Build the release version when any Rust source changes
$(TOOL): $(RUST_SOURCES)
	cargo build --release

# ===== Generic pattern rules using Python script =====

# Generic rule for all n-gram book configurations
# The Python script parses the full target name to extract n and books
$(OUT_DIR)/%.pdf $(OUT_DIR)/%.stamp: build_books.py book.typ $(TOOL)
	$(eval FULLNAME := $(notdir $(basename $@)))
	$(eval BASE := $(shell echo $(FULLNAME) | sed 's/-[0-9]*-[0-9]*$$//' ))
	./build_books.py $(FULLNAME) data/$(BASE).txt
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Generate a markdown summary of all PDFs
.PHONY: summary
summary:
	@echo "# Generated booklets" > $(OUT_DIR)/summary.md
	@echo "" >> $(OUT_DIR)/summary.md
	@echo "| Title | Subtitle | Pages | Filename |" >> $(OUT_DIR)/summary.md
	@echo "|-------|----------|-------|----------|" >> $(OUT_DIR)/summary.md
	@for pdf in $(OUT_DIR)/*.pdf; do \
		if [ -f "$$pdf" ]; then \
			filename=$$(basename "$$pdf"); \
			info=$$(pdfinfo "$$pdf" 2>/dev/null); \
			title=$$(echo "$$info" | grep "^Title:" | sed 's/^Title:[[:space:]]*//' | sed 's/[[:space:]]*$$//'); \
			subtitle=$$(echo "$$info" | grep "^Subject:" | sed 's/^Subject:[[:space:]]*//' | sed 's/[[:space:]]*$$//'); \
			pages=$$(echo "$$info" | grep "^Pages:" | awk '{print $$2}'); \
			if [ -z "$$title" ]; then title="(untitled)"; fi; \
			if [ -z "$$subtitle" ]; then subtitle="(no subtitle)"; fi; \
			if [ -z "$$pages" ]; then pages="?"; fi; \
			echo "| $$title | $$subtitle | $$pages | $$filename |" >> $(OUT_DIR)/summary.md; \
		fi; \
	done
	@echo "" >> $(OUT_DIR)/summary.md
	@echo "Generated: $$(date)" >> $(OUT_DIR)/summary.md
	@cat $(OUT_DIR)/summary.md

# Clean target to remove entire output directory
.PHONY: clean
clean:
	rm -rf $(OUT_DIR)
