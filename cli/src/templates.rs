//! The Typst templates and brand assets, compiled into the binary so a
//! release build works wherever it is copied rather than only while the
//! source tree still sits where it was built.

use std::fs;
use std::io;
use std::path::PathBuf;

/// Every file a template reaches by relative path: the entry points, the
/// modules they import, and the SVGs those load. `include_bytes!` makes cargo
/// track them, so editing a template rebuilds the binary.
const FILES: &[(&str, &[u8])] = &[
    ("book.typ", include_bytes!("../book.typ")),
    (
        "booklet-common.typ",
        include_bytes!("../booklet-common.typ"),
    ),
    ("socy-logo-bw.svg", include_bytes!("../socy-logo-bw.svg")),
    (
        "tokenized-cutouts.typ",
        include_bytes!("../tokenized-cutouts.typ"),
    ),
    (
        "tokenized-sheets.typ",
        include_bytes!("../tokenized-sheets.typ"),
    ),
    ("cutout-common.typ", include_bytes!("../cutout-common.typ")),
    ("lockup-light.svg", include_bytes!("../lockup-light.svg")),
    (
        "lockup-light-1.svg",
        include_bytes!("../lockup-light-1.svg"),
    ),
    (
        "lockup-light-2.svg",
        include_bytes!("../lockup-light-2.svg"),
    ),
    (
        "lockup-light-3.svg",
        include_bytes!("../lockup-light-3.svg"),
    ),
    (
        "lockup-light-4.svg",
        include_bytes!("../lockup-light-4.svg"),
    ),
    (
        "lockup-light-5.svg",
        include_bytes!("../lockup-light-5.svg"),
    ),
];

/// Write the bundled templates to a per-version directory under the system
/// temp dir (rewriting only files whose content changed, so a dev build with
/// edited templates still wins) and return that directory.
pub fn materialise() -> io::Result<PathBuf> {
    let dir = std::env::temp_dir().join(format!(
        "llms-unplugged-{}-templates",
        env!("CARGO_PKG_VERSION")
    ));
    fs::create_dir_all(&dir)?;
    for (name, bytes) in FILES {
        let path = dir.join(name);
        if fs::read(&path).ok().as_deref() != Some(*bytes) {
            fs::write(&path, bytes)?;
        }
    }
    Ok(dir)
}
