# Makefile for building all targets

# Define directories
OUT_DIR := out

# Define input files
BIGRAM_TEXTS := collected-hemingway frankenstein cloudstreet
TRIGRAM_TEXTS := TinyStories-20k

# Number of books to split trigrams into
TRIGRAM_BOOKS := 6

# Paper size configuration
PAPER_SIZE := a4

# Set columns based on paper size
ifeq ($(PAPER_SIZE),a4)
COLUMNS := 4
else ifeq ($(PAPER_SIZE),a5)
COLUMNS := 3
endif

# Generate PDF target lists
BIGRAM_PDFS := $(foreach text,$(BIGRAM_TEXTS),$(OUT_DIR)/$(text)-bigram-$(PAPER_SIZE).pdf)

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

# Pattern rule for bigram PDFs
$(OUT_DIR)/%-bigram-$(PAPER_SIZE).pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 2 $<
	$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Pattern rule for trigram book sets using a stamp file
# The stamp file tracks when the entire set was built
$(OUT_DIR)/%-trigram-$(PAPER_SIZE).stamp: data/%.txt book.typ $(TOOL)
	$(TOOL) --n 3 -b $(TRIGRAM_BOOKS) $< -o $(OUT_DIR)/$*-trigram.json
	@for i in $$(seq 1 $(TRIGRAM_BOOKS)); do \
		if [ -f $(OUT_DIR)/$*-trigram_book_$$i.json ]; then \
			cp $(OUT_DIR)/$*-trigram_book_$$i.json model.json; \
			$(TYPST) --input paper_size=$(PAPER_SIZE) --input columns=$(COLUMNS) book.typ $(OUT_DIR)/$*-trigram-$(PAPER_SIZE)-book$$i.pdf; \
			echo "Pages in $(OUT_DIR)/$*-trigram-$(PAPER_SIZE)-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-trigram-$(PAPER_SIZE)-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
			rm -f model.json; \
			rm -f $(OUT_DIR)/$*-trigram_book_$$i.json; \
		fi; \
	done
	@touch $@
	@echo "Created $(TRIGRAM_BOOKS) books for $*-trigram-$(PAPER_SIZE)"

# Generate stamp file targets for trigrams
TRIGRAM_STAMPS := $(foreach text,$(TRIGRAM_TEXTS),$(OUT_DIR)/$(text)-trigram-$(PAPER_SIZE).stamp)

# Default target to build all booklets
.PHONY: booklets
booklets: $(BIGRAM_PDFS) $(TRIGRAM_STAMPS)
	@echo "All booklets complete!"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf $(OUT_DIR)/*.json $(OUT_DIR)/*.stamp
