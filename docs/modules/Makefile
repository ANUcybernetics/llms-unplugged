# Makefile for converting markdown files and typst files to PDF

# Input and output directories
INPUT_DIR = .
OUTPUT_DIR = output
TEMPLATE = anu

# Find all markdown and typst source files
MD_FILES := $(wildcard $(INPUT_DIR)/*.md)
TYP_SOURCE_FILES := $(wildcard $(INPUT_DIR)/*.typ)
# Exclude llm-utils.typ as it's just a utility library
TYP_SOURCE_FILES := $(filter-out ./llm-utils.typ,$(TYP_SOURCE_FILES))

# Generate corresponding PDF names
MD_PDF_FILES := $(patsubst $(INPUT_DIR)/%.md,$(OUTPUT_DIR)/%.pdf,$(MD_FILES))
TYP_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))
PDF_FILES := $(MD_PDF_FILES) $(TYP_PDF_FILES)

# Default target
all: $(OUTPUT_DIR) $(PDF_FILES)

# Target to create a combined PDF from all individual PDFs
combined: $(OUTPUT_DIR) $(PDF_FILES)
	@echo "Combining all PDFs into combined.pdf..."
	pdfjam $(PDF_FILES) -o $(OUTPUT_DIR)/combined.pdf --fitpaper false

# Create output directory if it doesn't exist
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Convert markdown to PDF using pandoc with built-in ANU Typst template
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.md
	@echo "Processing markdown $<..."
	pandoc $< -o $@ --pdf-engine=typst --template=$(TEMPLATE)

# Compile typst files directly to PDF
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ llm-utils.typ
	@echo "Processing typst $<..."
	typst compile $< $@

# Clean target to remove generated files
clean:
	rm -rf $(OUTPUT_DIR)

# Phony targets
.PHONY: all clean combined