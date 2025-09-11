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
# For trigrams, we create 4 books each
TRIGRAM_PDFS := $(foreach text,$(TRIGRAM_TEXTS),$(foreach size,$(PAPER_SIZES),$(foreach book,1 2 3 4,$(OUT_DIR)/$(text)-trigram-$(size)-book$(book).pdf)))
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
	$(TYPST) --input paper_size=a4 --input columns=4 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

$(OUT_DIR)/%-bigram-a5.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 2 $<
	$(TYPST) --input paper_size=a5 --input columns=3 book.typ $@
	@echo "Pages in $@: $$(pdfinfo $@ | grep Pages | awk '{print $$2}')"

# Pattern rules for trigram PDFs with paper size (split into 4 books)
# We need separate rules for each book since Make doesn't handle multiple outputs well
$(OUT_DIR)/%-trigram-a4-book1.pdf $(OUT_DIR)/%-trigram-a4-book2.pdf $(OUT_DIR)/%-trigram-a4-book3.pdf $(OUT_DIR)/%-trigram-a4-book4.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 -b 4 $< -o $(OUT_DIR)/$*-trigram.json
	@for i in 1 2 3 4; do \
		cp $(OUT_DIR)/$*-trigram_book_$$i.json model.json; \
		$(TYPST) --input paper_size=a4 --input columns=4 --input subtitle="Book $$i of 4" book.typ $(OUT_DIR)/$*-trigram-a4-book$$i.pdf; \
		echo "Pages in $(OUT_DIR)/$*-trigram-a4-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-trigram-a4-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
		rm model.json; \
		rm $(OUT_DIR)/$*-trigram_book_$$i.json; \
	done
	@echo "Created 4 books for $*-trigram-a4"

$(OUT_DIR)/%-trigram-a5-book1.pdf $(OUT_DIR)/%-trigram-a5-book2.pdf $(OUT_DIR)/%-trigram-a5-book3.pdf $(OUT_DIR)/%-trigram-a5-book4.pdf: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 -b 4 $< -o $(OUT_DIR)/$*-trigram.json
	@for i in 1 2 3 4; do \
		cp $(OUT_DIR)/$*-trigram_book_$$i.json model.json; \
		$(TYPST) --input paper_size=a5 --input columns=3 --input subtitle="Book $$i of 4" book.typ $(OUT_DIR)/$*-trigram-a5-book$$i.pdf; \
		echo "Pages in $(OUT_DIR)/$*-trigram-a5-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-trigram-a5-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
		rm model.json; \
		rm $(OUT_DIR)/$*-trigram_book_$$i.json; \
	done
	@echo "Created 4 books for $*-trigram-a5"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf

.PHONY: all
