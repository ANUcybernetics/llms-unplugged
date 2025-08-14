# Makefile for building all targets

# Define directories
OUT_DIR := out

# Define input files
BIGRAM_TEXTS := collected-hemingway frankenstein cloudstreet
TRIGRAM_TEXTS := TinyStories-20k

# Define paper sizes
PAPER_SIZES := a4 a5

# Generate PDF target lists
BIGRAM_PDFS := $(foreach text,$(BIGRAM_TEXTS),$(foreach size,$(PAPER_SIZES),$(OUT_DIR)/$(text)-bigram-$(size).pdf))
TRIGRAM_PDFS := $(foreach text,$(TRIGRAM_TEXTS),$(foreach size,$(PAPER_SIZES),$(OUT_DIR)/$(text)-trigram-$(size).pdf))
ALL_PDFS := $(BIGRAM_PDFS) $(TRIGRAM_PDFS)

# Define common variables
TOOL := target/release/my_first_lm
TYPST := typst compile

# Ensure output directory exists
$(shell mkdir -p $(OUT_DIR))

# Default target to build all PDFs
all: $(ALL_PDFS)
	@echo "All processing complete!"

# Build the release version
$(TOOL):
	cargo build --release

# Pattern rule for bigram PDFs with paper size
$(OUT_DIR)/%-bigram-a4.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) --input paper_size=a4 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

$(OUT_DIR)/%-bigram-a5.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) --input paper_size=a5 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Pattern rule for trigram PDFs with paper size
$(OUT_DIR)/%-trigram-a4.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 $<
	$(TYPST) --input paper_size=a4 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

$(OUT_DIR)/%-trigram-a5.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 $<
	$(TYPST) --input paper_size=a5 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf

.PHONY: all
