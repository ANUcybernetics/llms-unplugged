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
	pdfjam $(MODULE_PDF_FILES) -o $(OUTPUT_DIR)/modules.pdf --fitpaper false --landscape --paper a4paper

# Target to create a combined PDF from modules 00-03 only
sxsw: $(OUTPUT_DIR) $(OUTPUT_DIR)/00-weighted-randomness.pdf $(OUTPUT_DIR)/01-basic-training.pdf $(OUTPUT_DIR)/02-basic-inference.pdf $(OUTPUT_DIR)/03-pretrained-inference.pdf
	@echo "Combining modules 00-03 into sxsw.pdf..."
	pdfjam $(OUTPUT_DIR)/00-weighted-randomness.pdf $(OUTPUT_DIR)/01-basic-training.pdf $(OUTPUT_DIR)/02-basic-inference.pdf $(OUTPUT_DIR)/03-pretrained-inference.pdf -o $(OUTPUT_DIR)/sxsw.pdf --fitpaper false --landscape --paper a4paper

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
.PHONY: all clean modules sxsw
