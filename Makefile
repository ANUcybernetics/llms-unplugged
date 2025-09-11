# Makefile for building all targets

# Define directories
OUT_DIR := out

# Define input files
BIGRAM_TEXTS := collected-hemingway frankenstein cloudstreet
TRIGRAM_TEXTS := TinyStories-20k

# Number of books to split trigrams into
TRIGRAM_BOOKS := 4

# Define paper sizes
PAPER_SIZES := a4 a5

# Generate PDF target lists
BIGRAM_PDFS := $(foreach text,$(BIGRAM_TEXTS),$(foreach size,$(PAPER_SIZES),$(OUT_DIR)/$(text)-bigram-$(size).pdf))

# Define common variables
TOOL := target/release/my_first_lm
TYPST := typst compile

# Ensure output directory exists
$(shell mkdir -p $(OUT_DIR))

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

# Define targets for trigram books using explicit rules
# This approach builds all books for a given text and size together
.PHONY: trigram-%-a4
trigram-%-a4: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 -b $(TRIGRAM_BOOKS) $< -o $(OUT_DIR)/$*-trigram.json
	@for i in $$(seq 1 $(TRIGRAM_BOOKS)); do \
		cp $(OUT_DIR)/$*-trigram_book_$$i.json model.json; \
		$(TYPST) --input paper_size=a4 --input columns=4 --input subtitle="Book $$i of $(TRIGRAM_BOOKS)" book.typ $(OUT_DIR)/$*-trigram-a4-book$$i.pdf; \
		echo "Pages in $(OUT_DIR)/$*-trigram-a4-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-trigram-a4-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
		rm model.json; \
		rm $(OUT_DIR)/$*-trigram_book_$$i.json; \
	done
	@echo "Created $(TRIGRAM_BOOKS) books for $*-trigram-a4"

.PHONY: trigram-%-a5
trigram-%-a5: data/%.txt book.typ $(TOOL)
	$(TOOL) --scale-d 120 --n 3 -b $(TRIGRAM_BOOKS) $< -o $(OUT_DIR)/$*-trigram.json
	@for i in $$(seq 1 $(TRIGRAM_BOOKS)); do \
		cp $(OUT_DIR)/$*-trigram_book_$$i.json model.json; \
		$(TYPST) --input paper_size=a5 --input columns=3 --input subtitle="Book $$i of $(TRIGRAM_BOOKS)" book.typ $(OUT_DIR)/$*-trigram-a5-book$$i.pdf; \
		echo "Pages in $(OUT_DIR)/$*-trigram-a5-book$$i.pdf: $$(pdfinfo $(OUT_DIR)/$*-trigram-a5-book$$i.pdf | grep Pages | awk '{print $$2}')"; \
		rm model.json; \
		rm $(OUT_DIR)/$*-trigram_book_$$i.json; \
	done
	@echo "Created $(TRIGRAM_BOOKS) books for $*-trigram-a5"

# Phony targets for building all trigram books
.PHONY: trigrams-a4
trigrams-a4: $(foreach text,$(TRIGRAM_TEXTS),trigram-$(text)-a4)

.PHONY: trigrams-a5
trigrams-a5: $(foreach text,$(TRIGRAM_TEXTS),trigram-$(text)-a5)

.PHONY: trigrams
trigrams: trigrams-a4 trigrams-a5

# Updated all target
.PHONY: all
all: $(BIGRAM_PDFS) trigrams
	@echo "All processing complete!"

# Clean target to remove generated files
.PHONY: clean
clean:
	rm -f $(OUT_DIR)/*.pdf $(OUT_DIR)/*.json
