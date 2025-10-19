# Makefile for converting typst files to PDF

# Input and output directories
INPUT_DIR = .
OUTPUT_DIR = out

# Find all typst source files (excluding utils.typ, draft/, and instructions.typ)
TYP_SOURCE_FILES := $(shell find $(INPUT_DIR) -name '*.typ' ! -name 'utils.typ' ! -path '*/draft/*' ! -name 'instructions.typ')

# Find numbered module files (00-*.typ through 99-*.typ)
MODULE_FILES := $(wildcard $(INPUT_DIR)/[0-9][0-9]-*.typ)
MODULE_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(MODULE_FILES))

# Generate corresponding PDF names
TYP_PDF_FILES := $(patsubst $(INPUT_DIR)/%.typ,$(OUTPUT_DIR)/%.pdf,$(TYP_SOURCE_FILES))
PDF_FILES := $(TYP_PDF_FILES)

# Default target
all: $(OUTPUT_DIR) $(PDF_FILES)

# Target to create a combined PDF from numbered modules only
modules: $(OUTPUT_DIR) $(MODULE_PDF_FILES)
	@echo "Combining numbered module PDFs into modules.pdf..."
	pdfunite $(MODULE_PDF_FILES) $(OUTPUT_DIR)/modules.pdf

# Target to create a combined PDF with instructor notes followed by all modules
mflm-resources: $(OUTPUT_DIR) $(OUTPUT_DIR)/instructors-notes.pdf modules
	@echo "Combining instructor notes and modules into mflm-resources.pdf..."
	pdfunite $(OUTPUT_DIR)/instructors-notes.pdf $(OUTPUT_DIR)/modules.pdf $(OUTPUT_DIR)/mflm-resources.pdf

# Create output directory if it doesn't exist
$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# Compile typst files directly to PDF
$(OUTPUT_DIR)/%.pdf: $(INPUT_DIR)/%.typ utils.typ
	@echo "Processing typst $<..."
	@mkdir -p $(dir $@)
	typst compile --root . $< $@

# Clean target to remove generated files
clean:
	rm -rf $(OUTPUT_DIR)

# Phony targets
.PHONY: all clean modules sxswmflm-resources
