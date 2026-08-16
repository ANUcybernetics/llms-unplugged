# Build handout PDFs (worksheets, poster)

INPUT_DIR = .
OUTPUT_DIR = out

TYP_SOURCE_FILES := $(shell find $(INPUT_DIR) -name '*.typ')
PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))

all: $(PDF_FILES)

# SOURCE_DATE_EPOCH=0 ensures reproducible builds (no timestamp metadata).
# --root .. is the repo root so worksheets can read shared corpora in data/
# (e.g. sycophancy-text.typ reads data/sycophancy.txt as its source of truth).
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ
	@echo "Processing typst $<..."
	@mkdir -p $(dir $@)
	SOURCE_DATE_EPOCH=0 typst compile --root .. $< $@

# Extra (non-.typ) prerequisites: files a worksheet reads at compile time,
# which the pattern rule above can't see --- without these, editing the data
# leaves a stale PDF that `publish` would happily ship.
$(OUTPUT_DIR)/worksheets/sycophancy-text.pdf: ../data/sycophancy.txt
$(OUTPUT_DIR)/worksheets/grid.pdf: worksheets/title-logo.svg

clean:
	rm -f $(PDF_FILES)

# Worksheets published under worksheets/ on pdf.llmsunplugged.org (linked
# from the lessons). `publish` stages them; upload with
# `ops/bucket-sync.py upload out/pdfs` from the repo root, then refresh the
# manifest (see that script's header).
PUBLISH_DIR = ../out/pdfs/worksheets
PUBLISHED = $(OUTPUT_DIR)/worksheets/grid.pdf $(OUTPUT_DIR)/worksheets/sycophancy-text.pdf

publish: $(PUBLISHED)
	mkdir -p $(PUBLISH_DIR)
	cp $(PUBLISHED) $(PUBLISH_DIR)/
	@echo "Staged to $(PUBLISH_DIR); upload with: ops/bucket-sync.py upload out/pdfs"

.PHONY: all clean publish
