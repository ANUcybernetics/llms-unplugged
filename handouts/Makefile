# Build handout PDFs (worksheets, runsheets, poster)

INPUT_DIR = .
OUTPUT_DIR = ../website/src/assets/pdfs

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

.PHONY: all clean
