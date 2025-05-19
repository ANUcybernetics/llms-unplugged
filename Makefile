# Makefile for building all targets

# Define directories
OUT_DIR := out

# Define input files
STANDARD_TEXTS := collected-hemingway frankenstein cloudstreet TinyStories-sample
SEUSS_OUTPUTS := dr-seuss-2 dr-seuss-3 dr-seuss-4

# Generate PDF target lists
STANDARD_PDFS := $(patsubst %,$(OUT_DIR)/%.pdf,$(STANDARD_TEXTS))
SEUSS_PDFS := $(patsubst %,$(OUT_DIR)/%.pdf,$(SEUSS_OUTPUTS))
ALL_PDFS := $(STANDARD_PDFS) $(SEUSS_PDFS)

# Define common variables
TOOL := target/release/my_first_lm
TYPST := typst compile book.typ

# Ensure output directory exists
$(shell mkdir -p $(OUT_DIR))

# Default target to build all PDFs
all: $(ALL_PDFS)
	@echo "All processing complete!"

# Build the release version
$(TOOL):
	cargo build --release

# Pattern rule for standard text files
$(OUT_DIR)/%.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 $<
	$(TYPST) $@

# Special rules for Dr. Seuss with different n values
$(OUT_DIR)/dr-seuss-2.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) $@

$(OUT_DIR)/dr-seuss-3.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 $<
	$(TYPST) $@

$(OUT_DIR)/dr-seuss-4.pdf: data/dr-seuss.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 4 $<
	$(TYPST) $@

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf

.PHONY: all
