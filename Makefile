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
	$(OUT_DIR)/frankenstein-3-1-$(PAPER_SIZE).pdf \
	$(OUT_DIR)/frankenstein-4-2-$(PAPER_SIZE).stamp \
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

# ===== Pattern rules for different n-gram and book configurations =====

# Pattern: n=2, books=1 (single book bigrams)
$(OUT_DIR)/%-2-1-$(PAPER_SIZE).pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 2 $< -o model.json
	$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"
	rm -f model.json

# Pattern: n=3, books=1 (single book trigrams)
$(OUT_DIR)/%-3-1-$(PAPER_SIZE).pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 3 $< -o model.json
	$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"
	rm -f model.json

# Pattern: n=4, books=1 (single book 4-grams)
$(OUT_DIR)/%-4-1-$(PAPER_SIZE).pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 4 $< -o model.json
	$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"
	rm -f model.json

# Pattern: n=2, books=2 (split into 2 books)
$(OUT_DIR)/%-2-2-$(PAPER_SIZE).stamp: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 2 -b 2 $< -o $(OUT_DIR)/$*-2-2.json
	@for i in $$(seq 1 2); do \
		if [ -f $(OUT_DIR)/$*-2-2_book_$$i.json ]; then \
			cp $(OUT_DIR)/$*-2-2_book_$$i.json model.json; \
			$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $(OUT_DIR)/$*-2-2-$(PAPER_SIZE)-book$$i.pdf; \
			echo "Pages in $(OUT_DIR)/$*-2-2-$(PAPER_SIZE)-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-2-2-$(PAPER_SIZE)-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
			rm -f model.json; \
			rm -f $(OUT_DIR)/$*-2-2_book_$$i.json; \
		fi; \
	done
	@touch $@
	@echo "Created 2 books for $*-2-2-$(PAPER_SIZE)"

# Pattern: n=3, books=3 (split into 3 books)
$(OUT_DIR)/%-3-3-$(PAPER_SIZE).stamp: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 3 -b 3 $< -o $(OUT_DIR)/$*-3-3.json
	@for i in $$(seq 1 3); do \
		if [ -f $(OUT_DIR)/$*-3-3_book_$$i.json ]; then \
			cp $(OUT_DIR)/$*-3-3_book_$$i.json model.json; \
			$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $(OUT_DIR)/$*-3-3-$(PAPER_SIZE)-book$$i.pdf; \
			echo "Pages in $(OUT_DIR)/$*-3-3-$(PAPER_SIZE)-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-3-3-$(PAPER_SIZE)-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
			rm -f model.json; \
			rm -f $(OUT_DIR)/$*-3-3_book_$$i.json; \
		fi; \
	done
	@touch $@
	@echo "Created 3 books for $*-3-3-$(PAPER_SIZE)"

# Pattern: n=4, books=2 (split into 2 books)
$(OUT_DIR)/%-4-2-$(PAPER_SIZE).stamp: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 4 -b 2 $< -o $(OUT_DIR)/$*-4-2.json
	@for i in $$(seq 1 2); do \
		if [ -f $(OUT_DIR)/$*-4-2_book_$$i.json ]; then \
			cp $(OUT_DIR)/$*-4-2_book_$$i.json model.json; \
			$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $(OUT_DIR)/$*-4-2-$(PAPER_SIZE)-book$$i.pdf; \
			echo "Pages in $(OUT_DIR)/$*-4-2-$(PAPER_SIZE)-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-4-2-$(PAPER_SIZE)-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
			rm -f model.json; \
			rm -f $(OUT_DIR)/$*-4-2_book_$$i.json; \
		fi; \
	done
	@touch $@
	@echo "Created 2 books for $*-4-2-$(PAPER_SIZE)"

# Default target to build all booklets
.PHONY: booklets
booklets: $(TARGETS)
	@echo "All booklets complete!"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf $(OUT_DIR)/*.json $(OUT_DIR)/*.stamp
