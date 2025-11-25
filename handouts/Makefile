# Makefile for converting typst files to PDF

# Input and output directories
INPUT_DIR = .
OUTPUT_DIR = ../website/src/assets/pdfs

# Find all typst source files (excluding utils.typ, draft/, and instructions.typ)
TYP_SOURCE_FILES := $(shell find $(INPUT_DIR) -name '*.typ' ! -name 'utils.typ' ! -path '*/draft/*' ! -name 'instructions.typ')

# Find numbered lesson files (00-*.typ through 99-*.typ)
LESSON_FILES := $(wildcard $(INPUT_DIR)/[0-9][0-9]-*.typ)
LESSON_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(LESSON_FILES))

# Generate corresponding PDF names
TYP_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))
PDF_FILES := $(TYP_PDF_FILES)

# Default target
all: $(OUTPUT_DIR) $(PDF_FILES) $(OUTPUT_DIR)/lessons.pdf

# Combined PDF from numbered lessons
# --deterministic-id ensures reproducible builds
$(OUTPUT_DIR)/lessons.pdf: $(LESSON_PDF_FILES)
	@echo "Combining numbered lesson PDFs into lessons.pdf..."
	qpdf --deterministic-id --empty --pages $(LESSON_PDF_FILES) -- $@


# Create output directory if it doesn't exist
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Compile typst files directly to PDF
# SOURCE_DATE_EPOCH=0 ensures reproducible builds (no timestamp metadata)
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ utils.typ ../website/package.json
	@echo "Processing typst $<..."
	@mkdir -p $(dir $@)
	SOURCE_DATE_EPOCH=0 typst compile --root . --input version="v$$(jq -r .version ../website/package.json)" $< $@

# Clean target to remove generated files
clean:
	rm -f $(PDF_FILES) $(OUTPUT_DIR)/lessons.pdf

# Lessons target (alias for building combined lesson PDF)
lessons: $(OUTPUT_DIR) $(LESSON_PDF_FILES) $(OUTPUT_DIR)/lessons.pdf

# Phony targets
.PHONY: all clean lessons
