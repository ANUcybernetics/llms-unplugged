import bookTemplate from "./book.typ?raw";
import cutoutsTemplate from "./tokenized-cutouts.typ?raw";
// Imported by tokenized-cutouts.typ, so it has to be mapped into the typst.ts
// virtual filesystem alongside it.
import cutoutCommon from "./cutout-common.typ?raw";

export { bookTemplate, cutoutsTemplate, cutoutCommon };
