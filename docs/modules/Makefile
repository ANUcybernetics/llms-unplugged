# Makefile for converting markdown files to PDF using Typst

# Input and output directories
INPUT_DIR = .
OUTPUT_DIR = output
TEMPLATE = anu

# Find all markdown files in the current directory
MD_FILES := $(wildcard $(INPUT_DIR)/*.md)
# Generate corresponding PDF names in output directory
PDF_FILES := $(patsubst $(INPUT_DIR)/%.md,$(OUTPUT_DIR)/%.pdf,$(MD_FILES))
# Intermediate Typst files
TYP_FILES := $(patsubst $(INPUT_DIR)/%.md,$(OUTPUT_DIR)/%.typ,$(MD_FILES))

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
	@echo "Processing $<..."
	pandoc $< -o $@ --pdf-engine=typst --template=$(TEMPLATE)

# Clean target to remove generated files
clean:
	rm -rf $(OUTPUT_DIR)

# Phony targets
.PHONY: all clean combined
