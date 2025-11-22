use llms_unplugged::{process_file, save_to_json};
use serde_json::json;
use std::fs::File;
use std::io::{self, Write};
use tempfile::NamedTempFile;

#[test]
fn regression_fixture_output_is_stable() -> io::Result<()> {
    let temp_file = NamedTempFile::new()?;
    let input_path = temp_file.path().to_owned();

    {
        let mut file = File::create(&input_path)?;
        writeln!(file, "---")?;
        writeln!(file, "title: Regression Fixture")?;
        writeln!(file, "author: Fixture Author")?;
        writeln!(file, "url: https://example.com/fixture")?;
        writeln!(file, "---")?;
        writeln!(file, "Hello world. Hello world again.")?;
        file.flush()?;
    }

    let (entries, stats, metadata) = process_file(&input_path, 2)?;

    let output_file = NamedTempFile::new()?;
    save_to_json(
        &entries,
        output_file.path(),
        metadata.as_ref(),
        Some(&stats),
        true,
    )?;

    let json_output: serde_json::Value = serde_json::from_reader(File::open(output_file.path())?)?;

    // Metadata regression
    let meta = json_output.get("metadata").expect("metadata present");
    assert_eq!(meta.get("title"), Some(&json!("Regression Fixture")));
    assert_eq!(meta.get("author"), Some(&json!("Fixture Author")));
    assert_eq!(meta.get("url"), Some(&json!("https://example.com/fixture")));

    // Data regression (raw counts)
    let expected_data = json!([
        [".", 1, ["hello", 1]],
        ["again", 1, [".", 1]],
        ["hello", 2, ["world", 2]],
        ["world", 2, [".", 1], ["again", 2]]
    ]);

    assert_eq!(
        json_output.get("data"),
        Some(&expected_data),
        "Data output should stay stable for fixture"
    );

    Ok(())
}
