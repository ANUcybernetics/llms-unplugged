# Makefile for building all targets

# Define directories
OUT_DIR := out
BIGRAM_DIR := $(OUT_DIR)/bigram
TRIGRAM_DIR := $(OUT_DIR)/trigram

# Define input files
STANDARD_TEXTS := collected-hemingway frankenstein cloudstreet TinyStories-10k TinyStories-20k TinyStories-100k
SEUSS_OUTPUTS := dr-seuss-2 dr-seuss-3 dr-seuss-4
TINYSTORIES_OUTPUTS := TinyStories-10k-4 TinyStories-20k-4

# Generate PDF target lists
STANDARD_BIGRAM_PDFS := $(patsubst %,$(BIGRAM_DIR)/%.pdf,$(STANDARD_TEXTS))
STANDARD_TRIGRAM_PDFS := $(patsubst %,$(TRIGRAM_DIR)/%.pdf,$(STANDARD_TEXTS))
SEUSS_PDFS := $(patsubst %,$(OUT_DIR)/%.pdf,$(SEUSS_OUTPUTS))
TINYSTORIES_PDFS := $(patsubst %,$(OUT_DIR)/%.pdf,$(TINYSTORIES_OUTPUTS))
ALL_PDFS := $(STANDARD_BIGRAM_PDFS) $(STANDARD_TRIGRAM_PDFS) $(SEUSS_PDFS) $(TINYSTORIES_PDFS)

# Define common variables
TOOL := target/release/my_first_lm
TYPST := typst compile book.typ

# Ensure output directories exist
$(shell mkdir -p $(OUT_DIR) $(BIGRAM_DIR) $(TRIGRAM_DIR))

# Default target to build all PDFs
all: $(ALL_PDFS)
	@echo "All processing complete!"

# Build the release version
$(TOOL):
	cargo build --release

# Pattern rule for bigram PDFs
$(BIGRAM_DIR)/%.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Pattern rule for trigram PDFs
$(TRIGRAM_DIR)/%.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Special rules for Dr. Seuss with different n values
$(OUT_DIR)/dr-seuss-2.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

$(OUT_DIR)/dr-seuss-3.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

$(OUT_DIR)/dr-seuss-4.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 4 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Special rule for TinyStories-10k with n=4
$(OUT_DIR)/TinyStories-10k-4.pdf: data/TinyStories-10k.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 4 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Special rule for TinyStories-20k with n=4
$(OUT_DIR)/TinyStories-20k-4.pdf: data/TinyStories-20k.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 4 $<
	$(TYPST) $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf $(BIGRAM_DIR)/*.pdf $(TRIGRAM_DIR)/*.pdf

.PHONY: all
