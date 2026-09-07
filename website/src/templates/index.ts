import bookTemplate from "./book.typ?raw";
// Imported by book.typ, so it has to be mapped into the typst.ts virtual
// filesystem alongside it.
import bookletCommon from "./booklet-common.typ?raw";
import cutoutsTemplate from "./tokenized-cutouts.typ?raw";
// Imported by tokenized-cutouts.typ, so it has to be mapped into the typst.ts
// virtual filesystem alongside it.
import cutoutCommon from "./cutout-common.typ?raw";
// The ledger set is three documents off one ledger.json: the sheets, the
// counters to cut up, and the training text for the reader.
import ledgerTemplate from "./ledger.typ?raw";
import ledgerCountersTemplate from "./ledger-counters.typ?raw";
import ledgerTextTemplate from "./ledger-text.typ?raw";
// Imported by all three ledger templates.
import ledgerCommon from "./ledger-common.typ?raw";

export {
  bookTemplate,
  bookletCommon,
  cutoutsTemplate,
  cutoutCommon,
  ledgerTemplate,
  ledgerCountersTemplate,
  ledgerTextTemplate,
  ledgerCommon,
};
