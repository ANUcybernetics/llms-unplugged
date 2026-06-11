# Build handout PDFs (worksheets, poster)

INPUT_DIR = .
OUTPUT_DIR = out

TYP_SOURCE_FILES := $(shell find $(INPUT_DIR) -name '*.typ')
PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))

all: $(PDF_FILES)

# SOURCE_DATE_EPOCH=0 ensures reproducible builds (no timestamp metadata)
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ
	@echo "Processing typst $<..."
	@mkdir -p $(dir $@)
	SOURCE_DATE_EPOCH=0 typst compile $< $@

clean:
	rm -f $(PDF_FILES)

# Worksheets published on the website (linked from the lessons); re-run after
# changing them and commit the copied PDF
PUBLISH_DIR = ../website/public/assets/pdfs/worksheets
PUBLISHED = $(OUTPUT_DIR)/worksheets/grid.pdf

publish: $(PUBLISHED)
	mkdir -p $(PUBLISH_DIR)
	cp $(PUBLISHED) $(PUBLISH_DIR)/

.PHONY: all clean publish
