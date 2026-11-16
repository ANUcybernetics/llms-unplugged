# Delivery packs: every printout one lesson needs, in one zip, for every length
# it runs at.
#
#   make pack-my-first-language-model
#   make pack-how-ai-writes-stories-ledger
#
# lands out/packs/<slug>.zip, where <slug> is the lesson's slug. A pack is the
# list of runs that produce the lesson's printouts plus a README naming what to
# print for which length, so a delivery is a download rather than a page of
# commands retyped from the website. The lesson pages describe the materials;
# this is where the exact runs live.
#
# Publish a rebuilt pack, then refresh the manifest --- the lesson page shows
# its download link only once the manifest lists packs/<slug>.zip:
#
#   ops/bucket-sync.py upload --key packs/<slug>.zip out/packs/<slug>.zip
#   ops/bucket-sync.py manifest
#
# Adding a pack: give it a pack-<slug> target that writes into
# $(PACKS)/<slug>/ and finishes with `$(call zip_pack,<slug>)`.
#
# `make archive`, at the foot of this file, gathers the tested lessons' decks and
# printables into a dated, point-in-time bundle.
#
# Needs jq, qpdf and curl on PATH alongside the CLI's own typst toolchain, and
# the untracked corpora in data/ (see AGENTS.md).

CLI := cli/target/release/llms_unplugged
OUT := out
PACKS := $(OUT)/packs

.PHONY: help packs clean-packs

help:
	@echo "make pack-my-first-language-model       the grid workshop's printouts"
	@echo "make pack-how-ai-writes-stories-ledger  the ledger workshop's printouts"
	@echo "make packs                              every pack"
	@echo "make clean-packs                        remove $(PACKS)"
	@echo "make archive                            a dated bundle and source zip"

packs: pack-my-first-language-model pack-how-ai-writes-stories-ledger

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

# A deck's slides, and the presenter guide (each slide followed by its
# speaker-notes page), for the archive. One run emits both, sharing the site
# build and preview server (astromotion >= 0.29); the captures are still
# separate, and decktape's per-slide pauses are most of the time, so this is
# the slow part of `make archive`. Needs website/ installed (`pnpm install`)
# and a Chrome/Chromium; --no-sandbox because the export drives headless
# Chrome, which will not start as root or in a container without it.
#
# DECK_PORT is the preview server's port: `make ... DECK_PORT=4331` when another
# dev server holds 4321.
#
# $(1) deck slug, $(2) destination directory
DECK_PORT ?= 4321
define deck_pdfs
	@echo "slides and presenter guide: $(1)"
	@cd website && ASTROMOTION_CHROME_ARGS=--no-sandbox pnpm exec astromotion-pdf $(1) \
		--port=$(DECK_PORT) --slides=$(abspath $(2))/slides.pdf \
		--notes=$(abspath $(2))/presenter-guide.pdf >/dev/null
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
# the page. The deck walks through the magpie set row by row, so its ROW_*
# constants have to be re-read off the sheets if this recipe changes.
#
# Training: blank sheets, and the numbered text page for whoever reads aloud.
# The words are written as the group meets them, so one sheet serves every
# text; LEDGER_BLANK_ROWS x 5 sheets has to cover the largest outdoors
# vocabulary (33 prefixes, the storm and the kookaburra).
#
# Each generation set is built twice. --rows decides both the sheet count and
# how much page a row gets, and a set dealt fewer rows than the default 12
# prints the rest blank --- so the first run reports the deal, and the second
# prints it at the density that deal needs.

LEDGER_SLUG := how-ai-writes-stories-ledger
LEDGER_DIR := $(PACKS)/$(LEDGER_SLUG)
LEDGER_DECKS := $(LEDGER_SLUG)-60min $(LEDGER_SLUG)-90min
LEDGER_STAGE := $(LEDGER_DIR)/.build
LEDGER_PALETTE := @cli/ledger-palette-four.json
LEDGER_SHEETS := 5
LEDGER_BLANK_ROWS := 10
LEDGER_BOOKS := the-wombat the-very-hungry-caterpillar \
	were-going-on-a-bear-hunt the-magpie the-cat-in-the-hat
LEDGER_TEXTS := beach storm kookaburra creek bush

LEDGER_BUDGET := 140

# Rows share the page height, so few rows means tall ones: at 140 tokens across
# five sheets the sparser books deal five or six rows to a sheet, and a row
# given a fifth of the page is a tally strip twice as tall as it is wide with
# the marks stranded in one corner of it. So the sheet is printed at whichever
# is larger, the rows it was dealt or this floor; the shortfall prints as blank
# rows at the foot of the page.
LEDGER_MIN_ROWS := 8

# The most rows any one sheet was dealt, floored. Every entry takes one row
# here (--max-followers matches the default --columns), so a sheet's rows are
# its entries.
LEDGER_ROWS_JQ := [[.sheets[] | [.pages[][]] | length] | max, $(LEDGER_MIN_ROWS)] | max

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

# A book written for the activities lives in data/originals/, the rest in data/.
book_src = $(firstword $(wildcard data/originals/$(1).txt) data/$(1).txt)

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
		$(call book_src,$(book)),$(LEDGER_STAGE)/$(book),\
		--max-tokens $(LEDGER_BUDGET) --max-followers 4 --prefill tallies \
		--brief none --even-pages)$(newline))
	$(foreach text,$(LEDGER_TEXTS),$(call build_text,training text: outdoors-$(text),\
		data/originals/outdoors-$(text).txt,$(LEDGER_STAGE)/outdoors-$(text))$(newline))
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
		$(foreach text,$(LEDGER_TEXTS),$(LEDGER_STAGE)/outdoors-$(text)/text.pdf) \
		-- $(LEDGER_DIR)/training-texts.pdf
	@cp $(LEDGER_STAGE)/blank/ledger.pdf $(LEDGER_DIR)/training-sheets.pdf
	@cp $(LEDGER_STAGE)/blank/brief.pdf $(LEDGER_DIR)/instructions.pdf
	@# Every set writes the same counters page; it depends only on the palette.
	@cp $(LEDGER_STAGE)/blank/counters.pdf $(LEDGER_DIR)/counters.pdf
	@cp docs/packs/$(LEDGER_SLUG).md $(LEDGER_DIR)/README.md
	$(call page_map,$(LEDGER_DIR)/README.md,Page map --- generation-ledgers.pdf,\
		$(foreach book,$(LEDGER_BOOKS),$(book):$(LEDGER_STAGE)/$(book)/ledger.pdf))
	$(call page_map,$(LEDGER_DIR)/README.md,Page map --- training-texts.pdf,\
		$(foreach text,$(LEDGER_TEXTS),outdoors-$(text):$(LEDGER_STAGE)/outdoors-$(text)/text.pdf))
	@rm -rf $(LEDGER_STAGE)
	$(call zip_pack,$(LEDGER_SLUG))

# ---------------------------------------------------------------------------
# My first language model (grid)
#
# Unlike the ledger pack, nothing here is built for the pack: every file is a
# published PDF, fetched from the bucket, so the pack holds the same files the
# lesson page and the Materials page link and can never drift from them. Each
# is built by its own Makefile --- the worksheets by handouts/, the booklets by
# cli/ --- and a rebuilt one goes to the bucket before the pack is rebuilt.
#
# The booklets are the bigram ones that print at a workshop-friendly length.
# The trigram booklets belong to the More context module, Collected Hemingway
# runs to 397 pages, and Jiangnan is for a Chinese-speaking room; all of them
# stay on the Materials page.

MFLM_SLUG := my-first-language-model
MFLM_DIR := $(PACKS)/$(MFLM_SLUG)
MFLM_DECKS := $(MFLM_SLUG)-60min $(MFLM_SLUG)-90min $(MFLM_SLUG)-2h
MFLM_BOOKLETS := green-eggs-and-ham the-cat-in-the-hat the-man-from-snowy-river \
	beatles a-christmas-carol frankenstein
PDF_BASE := https://pdf.llmsunplugged.org

# $(1) bucket key, $(2) destination file
define fetch_pdf
	@curl -fsSL --retry 3 -o $(2) $(PDF_BASE)/$(1)

endef

.PHONY: pack-$(MFLM_SLUG)
pack-$(MFLM_SLUG):
	@rm -rf $(MFLM_DIR)
	@mkdir -p $(MFLM_DIR)/booklets
	$(call fetch_pdf,worksheets/grid.pdf,$(MFLM_DIR)/grid.pdf)
	$(call fetch_pdf,worksheets/green-eggs-and-ham-text.pdf,$(MFLM_DIR)/training-text.pdf)
	$(foreach b,$(MFLM_BOOKLETS),$(call fetch_pdf,booklets/$(b).pdf,$(MFLM_DIR)/booklets/$(b).pdf))
	@cp docs/packs/$(MFLM_SLUG).md $(MFLM_DIR)/README.md
	$(call zip_pack,$(MFLM_SLUG))

# ---------------------------------------------------------------------------
# Archive: a dated, point-in-time bundle for each version
#
#   make archive
#
# lands out/archive/llms-unplugged-<version>.zip (the bundle) and
# out/archive/llms-unplugged-<version>-source.zip (a `git archive` of the
# v<version> tag). The version is the CLI
# crate's.
#
# The bundle is a dated snapshot for teachers, not a copy of the repo: only the
# lessons with a tested deck, each with its slides, presenter guide and
# printables, plus the prebuilt CLI. The website stays the living reference,
# and the bundle's README says so. Adding a lesson: give it an archive-<slug>
# target and list it in ARCHIVE_LESSONS.
#
# Printables are fetched from pdf.llmsunplugged.org, so the bundle holds the
# same files the website links; the two lessons with a pack take theirs from
# it. The CLI binaries come from the cli-dist workflow run for the v<version>
# tag, so push the tag and let that run finish first. Needs gh, curl and the
# pack dependencies above.

VERSION := $(shell sed -n 's/^version = "\(.*\)"/\1/p' cli/Cargo.toml | head -1)
ARCHIVE := $(OUT)/archive
ARCHIVE_NAME := llms-unplugged-$(VERSION)
ARCHIVE_DIR := $(ARCHIVE)/$(ARCHIVE_NAME)
ARCHIVE_LESSONS := my-first-language-model how-ai-writes-stories \
	how-ai-writes-stories-ledger

HAWS_CUTOUTS := green-eggs-and-ham were-going-on-a-bear-hunt where-is-the-green-sheep

# A deck's two PDFs, named for the deck, into a lesson's directory. A capture
# that never goes network-idle can print a one-page presenter guide without
# failing, so a guide no longer than its slides fails the build here instead.
# $(1) deck slug, $(2) lesson directory
define archive_deck
	$(call deck_pdfs,$(1),$(2)/.deck-$(1))
	@s=$$(qpdf --show-npages $(2)/.deck-$(1)/slides.pdf); \
	g=$$(qpdf --show-npages $(2)/.deck-$(1)/presenter-guide.pdf); \
	if [ "$$g" -le "$$s" ]; then echo "$(1): presenter guide has $$g pages for $$s slides" >&2; exit 1; fi
	@mv $(2)/.deck-$(1)/slides.pdf $(2)/$(1)-slides.pdf
	@mv $(2)/.deck-$(1)/presenter-guide.pdf $(2)/$(1)-presenter-guide.pdf
	@rm -rf $(2)/.deck-$(1)

endef

.PHONY: archive clean-archive archive-cli $(addprefix archive-,$(ARCHIVE_LESSONS))

archive: $(addprefix archive-,$(ARCHIVE_LESSONS)) archive-cli
	@sed 's/{{version}}/$(VERSION)/g; s/{{date}}/$(shell date +%Y-%m-%d)/g' \
		docs/archive/README.md > $(ARCHIVE_DIR)/README.md
	@cp LICENSE $(ARCHIVE_DIR)/LICENSE
	@cp handouts/LICENSE $(ARCHIVE_DIR)/LICENSE-CC-BY-SA-4.0
	@cp CITATION.cff $(ARCHIVE_DIR)/CITATION.cff
	cd $(ARCHIVE) && rm -f $(ARCHIVE_NAME).zip && zip -qr $(ARCHIVE_NAME).zip $(ARCHIVE_NAME)
	git archive --format=zip --prefix=$(ARCHIVE_NAME)-source/ v$(VERSION) \
		-o $(ARCHIVE)/$(ARCHIVE_NAME)-source.zip
	@echo "Wrote $(ARCHIVE)/$(ARCHIVE_NAME).zip and $(ARCHIVE_NAME)-source.zip"

clean-archive:
	rm -rf $(ARCHIVE)

archive-$(MFLM_SLUG): pack-$(MFLM_SLUG)
	@rm -rf $(ARCHIVE_DIR)/$(MFLM_SLUG)
	@mkdir -p $(ARCHIVE_DIR)/$(MFLM_SLUG)
	$(foreach deck,$(MFLM_DECKS),$(call archive_deck,$(deck),$(ARCHIVE_DIR)/$(MFLM_SLUG)))
	@cp -r $(MFLM_DIR) $(ARCHIVE_DIR)/$(MFLM_SLUG)/printouts

archive-how-ai-writes-stories:
	@rm -rf $(ARCHIVE_DIR)/$(@:archive-%=%)
	@mkdir -p $(ARCHIVE_DIR)/$(@:archive-%=%)/cutouts
	$(call archive_deck,how-ai-writes-stories,$(ARCHIVE_DIR)/$(@:archive-%=%))
	$(foreach c,$(HAWS_CUTOUTS),$(call fetch_pdf,cutouts/$(c).pdf,$(ARCHIVE_DIR)/$(@:archive-%=%)/cutouts/$(c).pdf))

archive-$(LEDGER_SLUG): pack-$(LEDGER_SLUG)
	@rm -rf $(ARCHIVE_DIR)/$(LEDGER_SLUG)
	@mkdir -p $(ARCHIVE_DIR)/$(LEDGER_SLUG)
	$(foreach deck,$(LEDGER_DECKS),$(call archive_deck,$(deck),$(ARCHIVE_DIR)/$(LEDGER_SLUG)))
	@cp -r $(LEDGER_DIR) $(ARCHIVE_DIR)/$(LEDGER_SLUG)/printouts

# The workflow uploads one packaged binary per target as its own artifact;
# `gh run download` unpacks each into a directory named for the artifact.
archive-cli:
	@rm -rf $(ARCHIVE_DIR)/cli $(ARCHIVE)/.cli
	@mkdir -p $(ARCHIVE_DIR)/cli
	@run=$$(gh run list --workflow cli-dist.yml --branch v$(VERSION) --status success \
		--limit 1 --json databaseId --jq '.[0].databaseId'); \
	if [ -z "$$run" ]; then echo "no successful cli-dist run for v$(VERSION); push the tag first" >&2; exit 1; fi; \
	gh run download $$run --dir $(ARCHIVE)/.cli
	@mv $(ARCHIVE)/.cli/*/* $(ARCHIVE_DIR)/cli/
	@rm -rf $(ARCHIVE)/.cli
