# Makefile for converting typst files to PDF
# Note: lesson PDFs are now built via website/scripts/build-lesson-pdfs.js

# Directories
INPUT_DIR = .
OUTPUT_DIR = ../website/src/assets/pdfs
PROJECT_ROOT = ..

# Find all typst source files (excluding draft/ and utils.typ which is now in ../typst/)
TYP_SOURCE_FILES := $(shell find $(INPUT_DIR) -name '*.typ' ! -path '*/draft/*')

# Generate corresponding PDF names
PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))

# Default target
all: $(OUTPUT_DIR) $(PDF_FILES)

# Create output directory if it doesn't exist
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Compile typst files directly to PDF
# SOURCE_DATE_EPOCH=0 ensures reproducible builds (no timestamp metadata)
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ $(PROJECT_ROOT)/typst/utils.typ $(PROJECT_ROOT)/website/package.json
	@echo "Processing typst $<..."
	@mkdir -p $(dir $@)
	SOURCE_DATE_EPOCH=0 typst compile --root $(PROJECT_ROOT) --input version="v$$(jq -r .version $(PROJECT_ROOT)/website/package.json)" $< $@

# Clean target to remove generated files
clean:
	rm -f $(PDF_FILES)

# Phony targets
.PHONY: all clean
