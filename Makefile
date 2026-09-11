# Delivery packs: everything one lesson or talk needs, in one zip.
#
#   make pack-how-ai-writes-stories-ledger
#   make pack-demystifying-large-language-models
#
# lands out/packs/<slug>.zip. A pack is the list of runs that produce that
# delivery's materials --- `llms_unplugged` for what gets printed,
# `astromotion-pdf` for a talk's slides and presenter guide --- plus a README
# naming what to print and how many copies, so a delivery is a download rather
# than a page of commands retyped from the website. The website's lesson and
# talk pages describe the materials; this is where the exact runs live.
#
# Publish a rebuilt pack, which is what the decks and talk pages link:
#
#   ops/bucket-sync.py upload --key packs/<slug>.zip out/packs/<slug>.zip
#
# Adding a pack: give it a pack-<slug> target that writes into
# $(PACKS)/<slug>/ and finishes with `$(call zip_pack,<slug>)`.
#
# Needs jq and qpdf on PATH alongside the CLI's own typst toolchain. The talk
# packs additionally need website/ installed (`pnpm install`) and a
# Chrome/Chromium, because they export their own deck PDFs.

CLI := cli/target/release/llms_unplugged
OUT := out
PACKS := $(OUT)/packs

.PHONY: help packs clean-packs

help:
	@echo "make pack-how-ai-writes-stories-ledger        the ledger workshop's printouts"
	@echo "make pack-demystifying-large-language-models  the 15-minute talk, end to end"
	@echo "make pack-unplugged-in-the-age-of-ai          the 20-minute talk, end to end"
	@echo "make packs                                    every pack"
	@echo "make clean-packs                              remove $(PACKS)"

packs: pack-how-ai-writes-stories-ledger pack-demystifying-large-language-models \
	pack-unplugged-in-the-age-of-ai

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

# A talk's slides, and the presenter guide (each slide followed by its
# speaker-notes page). Two exports because astromotion-pdf produces one PDF per
# run, and each run builds and previews the site --- so this is the slow half
# of a talk pack. --no-sandbox because the export drives headless Chrome, which
# will not start as root or in a container without it.
#
# $(1) deck slug, $(2) destination directory
define deck_pdfs
	@echo "slides: $(1)"
	@cd website && ASTROMOTION_CHROME_ARGS=--no-sandbox pnpm exec astromotion-pdf $(1) \
		$(abspath $(2))/slides.pdf >/dev/null
	@echo "presenter guide: $(1)"
	@cd website && ASTROMOTION_CHROME_ARGS=--no-sandbox pnpm exec astromotion-pdf $(1) \
		$(abspath $(2))/presenter-guide.pdf --notes >/dev/null
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

# ---------------------------------------------------------------------------
# Demystifying large language models (15-minute talk)
#
# A talk pack, so the zip is what one person needs to give it: the slides, the
# presenter guide, the sheets the room holds, and the lectern brief. The sheets
# are the only thing printed in quantity.
#
# The deal was pinned for the ANU Visionaries Showcase (15 Aug 2026) and is
# kept pinned here, so a reprint matches the copies already in a hall. Both the
# input order and the seed are load-bearing --- the deal is reproducible only
# from this exact combination. Note that the input order below is not the
# reveal order the talk uses (Hemingway, then Poe, then Seuss).
#
# --title and --author are what keep the sources off the page: the brief prints
# whatever the corpus metadata says, and joined real titles would spoil the
# reveal on the first sheet handed out.
#
# 120 sheets at the Cat in the Hat density. Pinning --sheets makes the count
# the participant count rather than something the corpus decides, and 120 is
# chosen so the set multiplies cleanly into a hall: printed three times for
# ~360 attendees, every token pair is held by three people, so the proportions
# are unchanged and one empty seat no longer takes a pair out of the room.
#
# 19.2pt is the largest size that still fits most pairs in one of four columns
# on A4. Past it, wide pairs start taking two column slots each and the sheet
# count runs away --- 21pt needs 195 sheets for the same corpus, 24pt needs 196
# even after dropping to three columns.
#
# 16 rows, not 15: a wide pair takes two of a row's four slots, and at 15 rows
# one sheet of this deal wanted a 61st slot and spilled onto a second page ---
# so one person in the hall would have been searching two pages. 16 rows is 64
# slots, which fits it. The deal is pinned by --sheets and --seed, so the rows
# only change how the pairs are laid out, never which sheet a pair lands on.
#
# Handed out at full A4, not imposed two-up onto A5. The imposition halves the
# paper but it also scales the page by 1/sqrt(2), which takes 19.2pt type down
# to an effective 13.6pt --- and the sheets are read at arm's length, in a
# darkened hall, by people who have never seen one before. Getting that back
# through the imposition would need ~27pt source and over 250 sheets, so A4 is
# both the biggest type and the smallest sheet count. It costs paper, and only
# paper.
#
# Two of the three corpora are gitignored: clone llms-unplugged-corpora and
# copy its texts into data/ before building this pack.

DEMYST_SLUG := demystifying-large-language-models
DEMYST_DIR := $(PACKS)/$(DEMYST_SLUG)
DEMYST_STAGE := $(DEMYST_DIR)/.build
DEMYST_SHEETS := 120
DEMYST_INPUTS := \
	--input data/the-cat-in-the-hat.txt \
	--input data/the-old-man-and-the-sea-excerpt.txt \
	--input data/the-tell-tale-heart.txt

.PHONY: pack-$(DEMYST_SLUG)
pack-$(DEMYST_SLUG): $(CLI)
	@rm -rf $(DEMYST_DIR)
	@mkdir -p $(DEMYST_STAGE)
	$(call deck_pdfs,$(DEMYST_SLUG),$(DEMYST_DIR))
	@echo "search sheets: three texts, dealt together"
	@./$(CLI) sheets $(DEMYST_INPUTS) -o $(DEMYST_STAGE) -n 2 \
		--sheets $(DEMYST_SHEETS) --rows 16 --font-size 19.2pt --seed 42 \
		--brief separate \
		--title "Demystifying large language models" --author "three authors" >/dev/null
	@mv $(DEMYST_STAGE)/sheets.pdf $(DEMYST_DIR)/search-sheets.pdf
	@# `--brief separate`: the brief is for the lectern and never goes into the
	@# handout stack, so it is a file of its own rather than page 1.
	@mv $(DEMYST_STAGE)/brief.pdf $(DEMYST_DIR)/lectern-brief.pdf
	@cp docs/packs/$(DEMYST_SLUG).md $(DEMYST_DIR)/README.md
	@rm -rf $(DEMYST_STAGE)
	$(call zip_pack,$(DEMYST_SLUG))

# ---------------------------------------------------------------------------
# Unplugged in the age of AI (20-minute talk)
#
# One corpus, and the brief bound in front of the handout as page 1 --- this
# talk's running order has the presenter reading the worked example off it, and
# the audience sees it too. That makes search-sheets.pdf the same set published
# as sheets/the-cat-in-the-hat.pdf, built here from the same flags so the pack
# stands alone.
#
# No --sheets: the count follows from the corpus at this density, which is 36.
# A bigger room deals its own with a --sheets of its own; the talk page says so.
# --rows 15 and 19.2pt are what keep Cat in the Hat legible when a printer
# reduces it to A5 for a two-up handout.

AGEOFAI_SLUG := unplugged-in-the-age-of-ai
AGEOFAI_DIR := $(PACKS)/$(AGEOFAI_SLUG)
AGEOFAI_STAGE := $(AGEOFAI_DIR)/.build

.PHONY: pack-$(AGEOFAI_SLUG)
pack-$(AGEOFAI_SLUG): $(CLI)
	@rm -rf $(AGEOFAI_DIR)
	@mkdir -p $(AGEOFAI_STAGE)
	$(call deck_pdfs,$(AGEOFAI_SLUG),$(AGEOFAI_DIR))
	@echo "search sheets: the-cat-in-the-hat"
	@./$(CLI) sheets --input data/the-cat-in-the-hat.txt -o $(AGEOFAI_STAGE) -n 2 \
		--rows 15 --font-size 19.2pt --seed 42 >/dev/null
	@mv $(AGEOFAI_STAGE)/sheets.pdf $(AGEOFAI_DIR)/search-sheets.pdf
	@cp docs/packs/$(AGEOFAI_SLUG).md $(AGEOFAI_DIR)/README.md
	@rm -rf $(AGEOFAI_STAGE)
	$(call zip_pack,$(AGEOFAI_SLUG))
