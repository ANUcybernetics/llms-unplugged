# Makefile for building all targets

# Define directories
OUT_DIR := out

# Define common variables
CARGO := cargo run --
TYPST := typst compile book.typ

# Ensure output directory exists
$(shell mkdir -p $(OUT_DIR))

# Default target to build all PDFs
all: $(OUT_DIR)/collected-hemingway.pdf $(OUT_DIR)/frankenstein.pdf $(OUT_DIR)/cloudstreet.pdf $(OUT_DIR)/dr-seuss-2.pdf $(OUT_DIR)/dr-seuss-3.pdf $(OUT_DIR)/dr-seuss-4.pdf
	@echo "All processing complete!"

# Rules for each output file
$(OUT_DIR)/collected-hemingway.pdf: data/collected-hemingway.txt book.typ
	$(CARGO) --scale-d 120 $<
	$(TYPST) $@

$(OUT_DIR)/frankenstein.pdf: data/frankenstein.txt book.typ
	$(CARGO) --scale-d 120 $<
	$(TYPST) $@

$(OUT_DIR)/cloudstreet.pdf: data/cloudstreet.txt book.typ
	$(CARGO) --scale-d 120 $<
	$(TYPST) $@

$(OUT_DIR)/dr-seuss-2.pdf: data/dr-seuss.txt book.typ
	$(CARGO) --scale-d 120 --n 2 $<
	$(TYPST) $@

$(OUT_DIR)/dr-seuss-3.pdf: data/dr-seuss.txt book.typ
	$(CARGO) --scale-d 120 --n 3 $<
	$(TYPST) $@

$(OUT_DIR)/dr-seuss-4.pdf: data/dr-seuss.txt book.typ
	$(CARGO) --scale-d 120 --n 4 $<
	$(TYPST) $@

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf

.PHONY: all