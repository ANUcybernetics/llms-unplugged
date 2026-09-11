# Workshop packs: everything to print for one lesson, in one zip.
#
#   make pack-how-ai-writes-stories-ledger
#
# lands out/packs/<slug>.zip. A lesson's pack is the list of `llms_unplugged`
# runs that produce its printouts, plus a README naming what to print and how
# many copies --- so a delivery is a download rather than a page of commands
# retyped from the lesson entry. The website's lesson pages describe the
# materials; this is where the exact runs live.
#
# Adding a lesson: give it a pack-<slug> target that writes into
# $(PACKS)/<slug>/ and finishes with `$(call zip_pack,<slug>)`.

CLI := cli/target/release/llms_unplugged
OUT := out
PACKS := $(OUT)/packs

.PHONY: help packs clean-packs

help:
	@echo "make pack-how-ai-writes-stories-ledger   the ledger workshop's printouts"
	@echo "make packs                               every pack"
	@echo "make clean-packs                         remove $(PACKS)"

packs: pack-how-ai-writes-stories-ledger

clean-packs:
	rm -rf $(PACKS)

$(CLI):
	cd cli && cargo build --release

# Zip the staged directory from inside $(PACKS), so the archive holds
# <slug>/... rather than the path from the repo root.
define zip_pack
	cd $(PACKS) && rm -f $(1).zip && zip -qr $(1).zip $(1)
	@echo "Wrote $(PACKS)/$(1).zip"
endef

# ---------------------------------------------------------------------------
# How AI writes stories (ledger)
#
# The zip is a handful of PDFs at the top level, one per thing you print, so a
# delivery is "print these" rather than a walk through ten folders. The CLI
# writes one directory per set, so the sets are built into a staging directory
# and the pieces gathered out of it: the five books' sheets concatenated, the
# five texts' pages concatenated, one blank sheet, one counters page and one
# instruction sheet (every set generates the same counters page --- it depends
# only on the palette --- and the sheets are built `--brief none` so the pack's
# one `--brief generic` instruction sheet is the only copy).
#
# The books' sheets are padded to an even page count (`--even-pages`), so the
# concatenation prints double-sided with each book starting on a fresh leaf and
# no leaf holding two groups' books.
#
# Generation: one pre-tallied picture book per group. --max-followers 4 is what
# keeps every word to a single row whatever the budget; the budget itself is
# what decides whether the set has a word the sheets can draw but have no row
# for, so it comes from ops/ledger-sweep.py's `dead` column and not from
# taste. 140 clears it for all five books.
#
# The room has counters in four colours, so the palette is four and every row
# takes the same four --- a row's colours no longer depend on where it sits on
# the page. The deck walks through the Dick and Jane set row by row, so its
# ROW_* constants have to be re-read off the sheets if this recipe changes.
#
# Training: blank sheets, and the numbered text page for whoever reads aloud.
# The words are written as the group meets them, so one sheet serves every
# text; LEDGER_BLANK_ROWS x 5 sheets has to cover the largest school-day
# vocabulary (38 prefixes).
#
# Each generation set is built twice. --rows decides both the sheet count and
# how much page a row gets, and a set dealt fewer rows than the default 12
# prints the rest blank --- so the first run reports the deal, and the second
# prints it at the density that deal needs: full pages, and the smaller the
# model the more room each row gets to write in.
#
# Needs jq and qpdf on PATH alongside the CLI's own typst toolchain.
LEDGER_SLUG := how-ai-writes-stories-ledger
LEDGER_DIR := $(PACKS)/$(LEDGER_SLUG)
LEDGER_STAGE := $(LEDGER_DIR)/.build
LEDGER_PALETTE := @cli/ledger-palette-four.json
LEDGER_SHEETS := 5
LEDGER_BLANK_ROWS := 10
LEDGER_BOOKS := green-eggs-and-ham the-very-hungry-caterpillar \
	were-going-on-a-bear-hunt fun-with-dick-and-jane the-cat-in-the-hat
LEDGER_TEXTS := bell bus dog rain volcano

LEDGER_BUDGET := 140

# The most rows any one sheet was dealt. Every entry takes one row here
# (--max-followers matches the default --columns), so a sheet's rows are its
# entries.
LEDGER_ROWS_JQ := [.sheets[] | [.pages[][]] | length] | max

# The most counters of one colour a single draw can need: the largest tally
# anywhere in the pack, read across all five books (`jq -s`). A set's own brief
# works this out for itself; the pack's instruction sheet fronts five sets, so
# it takes the number as an input.
LEDGER_COUNTERS_JQ := [.[].sheets[].pages[][].followers[].count] | max

# $(foreach) joins its expansions with a space, which would run the last line
# of one set's recipe into the first line of the next; this puts the newline
# back.
define newline


endef

# $(1) label, $(2) corpus path, $(3) output dir, $(4) extra ledger flags
define build_ledger
	@echo "$(1)"
	@./$(CLI) ledger -i $(2) --sheets $(LEDGER_SHEETS) --palette $(LEDGER_PALETTE) \
		--json-only -o $(3) $(4) >/dev/null
	@./$(CLI) ledger -i $(2) --sheets $(LEDGER_SHEETS) --palette $(LEDGER_PALETTE) \
		--rows $$(jq '$(LEDGER_ROWS_JQ)' $(3)/ledger.json) -o $(3) $(4) >/dev/null
endef

# The training sets are here only for their text.pdf, so one plain run each.
# $(1) label, $(2) corpus path, $(3) output dir
define build_text
	@echo "$(1)"
	@./$(CLI) ledger -i $(2) --sheets $(LEDGER_SHEETS) --palette $(LEDGER_PALETTE) \
		--max-followers 4 -o $(3) >/dev/null
endef

# Append "- pages A-B --- name" for each file, so the README's page map is read
# off the PDFs that went into the concatenation rather than assumed.
# $(1) README, $(2) heading, $(3) space-separated name:file pairs
define page_map
	@printf '\n## %s\n\n' "$(2)" >> $(1)
	@first=1; for pair in $(3); do \
		name=$${pair%%:*}; file=$${pair#*:}; \
		n=$$(qpdf --show-npages "$$file"); last=$$((first + n - 1)); \
		if [ "$$n" -eq 1 ]; then printf -- '- page %s --- %s\n' "$$first" "$$name" >> $(1); \
		else printf -- '- pages %s-%s --- %s\n' "$$first" "$$last" "$$name" >> $(1); fi; \
		first=$$((last + 1)); \
	done
endef

.PHONY: pack-$(LEDGER_SLUG)
pack-$(LEDGER_SLUG): $(CLI)
	@rm -rf $(LEDGER_DIR)
	@mkdir -p $(LEDGER_STAGE)
	$(foreach book,$(LEDGER_BOOKS),$(call build_ledger,generation: $(book),\
		data/$(book).txt,$(LEDGER_STAGE)/$(book),\
		--max-tokens $(LEDGER_BUDGET) --max-followers 4 --prefill tallies \
		--brief none --even-pages)$(newline))
	$(foreach text,$(LEDGER_TEXTS),$(call build_text,training text: school-day-$(text),\
		data/originals/school-day-$(text).txt,$(LEDGER_STAGE)/school-day-$(text))$(newline))
	@echo "training sheet: blank, and the pack's instruction sheet"
	@./$(CLI) ledger --blank --palette $(LEDGER_PALETTE) --rows $(LEDGER_BLANK_ROWS) \
		--brief generic --brief-counters \
		$$(jq -s '$(LEDGER_COUNTERS_JQ)' \
			$(foreach book,$(LEDGER_BOOKS),$(LEDGER_STAGE)/$(book)/ledger.json)) \
		-o $(LEDGER_STAGE)/blank >/dev/null
	@qpdf --empty --pages \
		$(foreach book,$(LEDGER_BOOKS),$(LEDGER_STAGE)/$(book)/ledger.pdf) \
		-- $(LEDGER_DIR)/generation-ledgers.pdf
	@qpdf --empty --pages \
		$(foreach text,$(LEDGER_TEXTS),$(LEDGER_STAGE)/school-day-$(text)/text.pdf) \
		-- $(LEDGER_DIR)/training-texts.pdf
	@cp $(LEDGER_STAGE)/blank/ledger.pdf $(LEDGER_DIR)/training-sheets.pdf
	@cp $(LEDGER_STAGE)/blank/brief.pdf $(LEDGER_DIR)/instructions.pdf
	@# Every set writes the same counters page; it depends only on the palette.
	@cp $(LEDGER_STAGE)/blank/counters.pdf $(LEDGER_DIR)/counters.pdf
	@cp docs/packs/$(LEDGER_SLUG).md $(LEDGER_DIR)/README.md
	$(call page_map,$(LEDGER_DIR)/README.md,Page map --- generation-ledgers.pdf,\
		$(foreach book,$(LEDGER_BOOKS),$(book):$(LEDGER_STAGE)/$(book)/ledger.pdf))
	$(call page_map,$(LEDGER_DIR)/README.md,Page map --- training-texts.pdf,\
		$(foreach text,$(LEDGER_TEXTS),school-day-$(text):$(LEDGER_STAGE)/school-day-$(text)/text.pdf))
	@rm -rf $(LEDGER_STAGE)
	$(call zip_pack,$(LEDGER_SLUG))
