# Makefile for building all targets

# Define directories
OUT_DIR := out

# Paper size configuration
PAPER_SIZE := a4

# ===== Target specification =====
# Format: name-n-books-papersize
# - Single book (books=1): use .pdf extension
#   e.g., frankenstein-2-1-$(PAPER_SIZE).pdf
# - Multiple books (books>1): use .stamp extension
#   e.g., frankenstein-4-2-$(PAPER_SIZE).stamp
#   This will generate frankenstein-4-2-a4-book1.pdf, frankenstein-4-2-a4-book2.pdf, etc.

TARGETS := \
	$(OUT_DIR)/cloudstreet-2-1-$(PAPER_SIZE).pdf \
	$(OUT_DIR)/frankenstein-2-1-$(PAPER_SIZE).pdf \
	$(OUT_DIR)/frankenstein-3-2-$(PAPER_SIZE).stamp \
	$(OUT_DIR)/frankenstein-4-3-$(PAPER_SIZE).stamp \
	$(OUT_DIR)/collected-hemingway-2-2-$(PAPER_SIZE).stamp \
	$(OUT_DIR)/TinyStories-20k-3-3-$(PAPER_SIZE).stamp

# Set columns based on paper size
ifeq ($(PAPER_SIZE),a4)
COLUMNS := 4
else ifeq ($(PAPER_SIZE),a5)
COLUMNS := 3
endif

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
# The Python script parses the full target name to extract n, books, and paper_size
$(OUT_DIR)/%.pdf $(OUT_DIR)/%.stamp: build_books.py book.typ $(TOOL)
	$(eval FULLNAME := $(notdir $(basename $@)))
	$(eval BASE := $(shell echo $(FULLNAME) | sed 's/-[0-9]*-[0-9]*-[a-z0-9]*$$//' ))
	./build_books.py $(FULLNAME) data/$(BASE).txt
	@if echo "$@" | grep -q '.stamp$$'; then touch $@; fi

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf $(OUT_DIR)/*.json $(OUT_DIR)/*.stamp
