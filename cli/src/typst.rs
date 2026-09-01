//! Turning JSON into PDFs: the bundled Typst templates, the one place the
//! crate shells out to `typst`, and the `qpdf`/`pdfinfo` steps around it.
//! Every subcommand that prints goes through [`compile`], so the invocation,
//! the repacking and their error handling cannot drift between pipelines.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Every file a template reaches by relative path: the entry points, the
/// modules they import, and the SVGs those load. `include_bytes!` makes cargo
/// track them, so editing a template rebuilds the binary --- and a release
/// binary works wherever it is copied rather than only while the source tree
/// still sits where it was built.
const TEMPLATE_FILES: &[(&str, &[u8])] = &[
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
    ("ledger.typ", include_bytes!("../ledger.typ")),
    ("ledger-common.typ", include_bytes!("../ledger-common.typ")),
    (
        "ledger-counters.typ",
        include_bytes!("../ledger-counters.typ"),
    ),
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

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error(
        "Typst binary not found at '{}'. Install typst or set TYPST_BIN to the binary path.",
        .0.display()
    )]
    NotFound(PathBuf),
    #[error("Failed to run typst: {0}")]
    Spawn(io::Error),
    #[error("Typst compile failed for {}: {stderr}", .pdf.display())]
    Failed { pdf: PathBuf, stderr: String },
    #[error("Typst template not found at {}", .0.display())]
    TemplateNotFound(PathBuf),
}

/// Write the bundled templates to a per-version directory under the system
/// temp dir (rewriting only files whose content changed, so a dev build with
/// edited templates still wins) and return the path of `name` within it.
pub fn template_path(name: &str) -> Result<PathBuf, Error> {
    let dir = std::env::temp_dir().join(format!(
        "llms-unplugged-{}-templates",
        env!("CARGO_PKG_VERSION")
    ));
    fs::create_dir_all(&dir)?;
    for (file, bytes) in TEMPLATE_FILES {
        let path = dir.join(file);
        if fs::read(&path).ok().as_deref() != Some(*bytes) {
            fs::write(&path, bytes)?;
        }
    }
    Ok(dir.join(name))
}

/// Absolutise a path for passing to typst, which is invoked with `--root /`
/// so its inputs can live anywhere relative to the caller's cwd.
pub fn abs_path_string(path: &Path) -> String {
    fs::canonicalize(path)
        .unwrap_or_else(|_| path.to_path_buf())
        .display()
        .to_string()
}

/// Compile one of the bundled templates to `pdf_path`; see [`compile`].
pub fn compile_template(
    template: &str,
    inputs: &[(String, String)],
    pdf_path: &Path,
) -> Result<(), Error> {
    compile(&template_path(template)?, inputs, pdf_path)
}

/// Run `typst compile --root /` on `template`, passing `inputs` through as
/// `--input key=value` pairs, write `pdf_path`, repack it, and report its
/// size. `template` may be anywhere on disk (the `pdf` command accepts a
/// user-supplied one); the bundled templates go through
/// [`compile_template`].
pub fn compile(template: &Path, inputs: &[(String, String)], pdf_path: &Path) -> Result<(), Error> {
    let template =
        fs::canonicalize(template).map_err(|_| Error::TemplateNotFound(template.to_path_buf()))?;
    if let Some(parent) = pdf_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let typst_bin =
        std::env::var_os("TYPST_BIN").map_or_else(|| PathBuf::from("typst"), PathBuf::from);
    let mut typst_cmd = Command::new(&typst_bin);
    typst_cmd.arg("compile");
    typst_cmd.arg("--root");
    typst_cmd.arg("/");
    for (key, value) in inputs {
        typst_cmd.arg("--input");
        typst_cmd.arg(format!("{key}={value}"));
    }
    typst_cmd.arg(&template);
    typst_cmd.arg(pdf_path);

    let output = typst_cmd.output().map_err(|e| {
        if e.kind() == io::ErrorKind::NotFound {
            Error::NotFound(typst_bin.clone())
        } else {
            Error::Spawn(e)
        }
    })?;
    if !output.status.success() {
        return Err(Error::Failed {
            pdf: pdf_path.to_path_buf(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        });
    }

    let before = fs::metadata(pdf_path).map_or(0, |m| m.len());
    repack_pdf(pdf_path);
    let after = fs::metadata(pdf_path).map_or(0, |m| m.len());

    eprintln!(
        "Wrote PDF to {} ({})",
        pdf_path.display(),
        human_bytes(after)
    );
    if after < before {
        eprintln!(
            "  repacked with object streams: {} smaller",
            human_bytes(before - after)
        );
    }
    Ok(())
}

/// Repack `pdf_path` in place so the PDF is no bigger than it needs to be.
///
/// Typst writes a tagged PDF, and one cutouts or sheets page is a few hundred
/// separately tagged tokens: the-cat-in-the-hat sheets carry 6216 `StructElem`
/// dictionaries against 25 pages of drawing. PDF compresses streams but not
/// loose objects, so that tag tree lands uncompressed and is most of the file.
/// Object streams pack those dictionaries into compressed streams, cutting a
/// sheets set by about 70% with no change to what renders and the tags kept —
/// they are what a screen reader uses on the teacher-facing brief.
///
/// `--deterministic-id` derives the file ID from the content rather than the
/// clock, so a rebuild stays byte-identical: the cutouts and sheets PDFs are
/// committed, and a random ID would dirty a megabyte of git on every `make`.
///
/// Best-effort: qpdf is not needed to *make* a booklet, so a missing or
/// unhappy qpdf warns and leaves the typst output in place rather than failing
/// the command.
fn repack_pdf(pdf_path: &Path) {
    let result = Command::new("qpdf")
        .arg("--object-streams=generate")
        .arg("--recompress-flate")
        .arg("--compression-level=9")
        .arg("--deterministic-id")
        .arg("--replace-input")
        .arg(pdf_path)
        .output();

    match result {
        Ok(output) if output.status.success() => {}
        Ok(output) => {
            // Exit code 3 is qpdf's "succeeded with warnings", which still
            // writes a valid file, so only a real failure is worth reporting.
            if output.status.code() != Some(3) {
                eprintln!(
                    "Warning: qpdf could not repack {}, leaving it uncompressed: {}",
                    pdf_path.display(),
                    String::from_utf8_lossy(&output.stderr).trim()
                );
            }
        }
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            eprintln!(
                "Warning: qpdf not found, so {} is several times larger than it needs to be. \
                 Install qpdf to shrink it.",
                pdf_path.display()
            );
        }
        Err(e) => {
            eprintln!("Warning: failed to run qpdf on {}: {e}", pdf_path.display());
        }
    }
}

/// Page count of a PDF, via `pdfinfo`. `None` if poppler isn't installed or
/// the output can't be parsed --- callers treat it as "don't know" rather than
/// failing, since it's only used for advisory checks.
pub fn page_count(pdf_path: &Path) -> Option<usize> {
    let output = Command::new("pdfinfo").arg(pdf_path).output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8_lossy(&output.stdout)
        .lines()
        .find_map(|line| line.strip_prefix("Pages:"))
        .and_then(|count| count.trim().parse().ok())
}

/// Byte count in the largest unit that keeps it readable, for the PDF size
/// lines. Sizes here run from tens of kilobytes to a few megabytes.
fn human_bytes(bytes: u64) -> String {
    const MB: u64 = 1024 * 1024;
    const KB: u64 = 1024;
    if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else {
        format!("{} KB", bytes.div_ceil(KB))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn templates_materialise_once_and_resolve_by_name() {
        let book = template_path("book.typ").unwrap();
        assert!(book.exists());
        assert_eq!(
            fs::read(&book).unwrap(),
            include_bytes!("../book.typ"),
            "the materialised template is the bundled one"
        );
        assert_eq!(book.parent(), template_path("ledger.typ").unwrap().parent());
    }

    #[test]
    fn a_missing_template_is_reported_by_path() {
        let err = compile(
            Path::new("/nonexistent/x.typ"),
            &[],
            Path::new("/tmp/x.pdf"),
        )
        .unwrap_err();
        assert!(matches!(err, Error::TemplateNotFound(_)), "got: {err}");
    }

    #[test]
    fn human_bytes_picks_a_unit() {
        assert_eq!(human_bytes(1023), "1 KB");
        assert_eq!(human_bytes(1024 * 1024 * 3 / 2), "1.5 MB");
    }
}
