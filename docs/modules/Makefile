# Makefile for converting markdown files and typst files to PDF

# Theme configuration (dark or light)
ANU_THEME = dark

# Input and output directories
INPUT_DIR = .
OUTPUT_DIR = out
TEMPLATE = anu

# Find all markdown and typst source files
MD_FILES := $(wildcard $(INPUT_DIR)/*.md)
TYP_SOURCE_FILES := $(wildcard $(INPUT_DIR)/*.typ)
# Exclude llm-utils.typ as it's just a utility library
TYP_SOURCE_FILES := $(filter-out ./llm-utils.typ,$(TYP_SOURCE_FILES))

# Find numbered module files (00-*.typ through 09-*.typ)
MODULE_FILES := $(wildcard $(INPUT_DIR)/0[0-9]-*.typ)
MODULE_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(MODULE_FILES))

# Generate corresponding PDF names
MD_PDF_FILES := $(patsubst $(INPUT_DIR)/%.md,$(OUTPUT_DIR)/%.pdf,$(MD_FILES))
TYP_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))
PDF_FILES := $(MD_PDF_FILES) $(TYP_PDF_FILES)

# Default target
all: $(OUTPUT_DIR) $(PDF_FILES)

# Target to create a combined PDF from numbered modules only
modules: $(OUTPUT_DIR) $(MODULE_PDF_FILES)
	@echo "Combining numbered module PDFs into modules.pdf..."
	pdfjam $(MODULE_PDF_FILES) -o $(OUTPUT_DIR)/modules.pdf --fitpaper false --landscape --paper a4paper

# Create output directory if it doesn't exist
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Convert markdown to PDF using pandoc with built-in ANU Typst template
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.md
	@echo "Processing markdown $<..."
	pandoc $< -o $@ --pdf-engine=typst --template=$(TEMPLATE)

# Compile typst files directly to PDF
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ llm-utils.typ
	@echo "Processing typst $< with theme $(ANU_THEME)..."
	typst compile --input anu_theme=$(ANU_THEME) $< $@

# Clean target to remove generated files
clean:
	rm -rf $(OUTPUT_DIR)

# Phony targets
.PHONY: all clean modules