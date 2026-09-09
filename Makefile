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
# Training: one school-day text per group, prefixes printed and the tallies
# left to make, plus the numbered text page for whoever reads aloud.
#
# Each set is built twice. --rows decides both the sheet count and how much
# page a row gets, and a set dealt fewer rows than the default 12 prints the
# rest blank --- so the first run reports the deal, and the second prints it
# at the density that deal needs: full pages, and the smaller the model the
# more room each row gets to write in.
LEDGER_SLUG := how-ai-writes-stories-ledger
LEDGER_DIR := $(PACKS)/$(LEDGER_SLUG)
LEDGER_PALETTE := @cli/ledger-palette-four.json
LEDGER_SHEETS := 5
LEDGER_BOOKS := green-eggs-and-ham the-very-hungry-caterpillar \
	were-going-on-a-bear-hunt fun-with-dick-and-jane the-cat-in-the-hat
LEDGER_TEXTS := bell bus dog rain volcano

LEDGER_BUDGET := 140

# The most rows any one sheet was dealt. Every entry takes one row here
# (--max-followers matches the default --columns), so a sheet's rows are its
# entries.
LEDGER_ROWS_JQ := [.sheets[] | [.pages[][]] | length] | max

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
		--rows $$(jq '$(LEDGER_ROWS_JQ)' $(3)/ledger.json) -o $(3) $(4)
	@rm -f $(3)/ledger.json
endef

.PHONY: pack-$(LEDGER_SLUG)
pack-$(LEDGER_SLUG): $(CLI)
	@rm -rf $(LEDGER_DIR)
	@mkdir -p $(LEDGER_DIR)
	$(foreach book,$(LEDGER_BOOKS),$(call build_ledger,generation: $(book),\
		data/$(book).txt,$(LEDGER_DIR)/generation/$(book),\
		--max-tokens $(LEDGER_BUDGET) \
		--max-followers 4 --prefill tallies)$(newline))
	$(foreach text,$(LEDGER_TEXTS),$(call build_ledger,training: school-day-$(text),\
		data/originals/school-day-$(text).txt,\
		$(LEDGER_DIR)/training/school-day-$(text),\
		--max-followers 4 --prefill prefixes)$(newline))
	@# The generation sets come pre-tallied, so nobody reads their text aloud
	@# and the text page would only be the book reproduced --- which is not
	@# ours to put in a zip. The training texts are ours, and keep theirs.
	@find $(LEDGER_DIR)/generation -name 'text.pdf' -delete
	@cp docs/packs/$(LEDGER_SLUG).txt $(LEDGER_DIR)/README.txt
	$(call zip_pack,$(LEDGER_SLUG))
