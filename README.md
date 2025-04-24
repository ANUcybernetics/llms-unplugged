# My First LM

This project provides tools to process text, calculate n-gram statistics (like word frequencies following a sequence of n-1 words), and generate a "rollable" n-gram language model booklet using [Typst](https://typst.app/). You can use this to explore the statistical patterns in a text corpus in a hands-on way.

This project is implemented in Rust.

## Installation

You will need:

1.  **Rust:** Install the Rust toolchain (including `cargo`) from [https://rustup.rs/](https://rustup.rs/).
2.  **Typst:** Install Typst from [https://github.com/typst/typst/](https://github.com/typst/typst/).

## Usage

The process involves two main steps: generating the n-gram statistics from your text file using the Rust program, and then typesetting those statistics into a booklet using Typst.

1.  **Build the Statistics Generator:**
    Navigate to the project directory in your terminal and build the Rust executable:
    ```bash
    cargo build --release
    ```
    This will create an executable file at `target/release/my_first_lm`.

2.  **Generate N-gram Statistics:**
    Run the compiled executable, providing your input text file and optionally specifying an output JSON file.

    ```bash
    ./target/release/my_first_lm <input_text_file> [OPTIONS]
    ```

    **Arguments:**
    *   `<input_text_file>`: Path to the text file you want to analyze.

    **Options:**
    *   `-o, --output <output_json_file>`: Path where the generated n-gram statistics (in JSON format) will be saved. Defaults to `model.json`.
    *   `-n, --n <N>`: The size of the n-gram (e.g., `2` for bigrams, `3` for trigrams). Defaults to `2`.
    *   `--scale-to-d120`: Scale follower counts to sum to 120, suitable for rolling a 120-sided die. If a prefix has more than 120 unique followers, scaling is skipped for that prefix. Defaults to `false`.

    **Example (generating d120-scaled bigram statistics):**
    Let's say you have your text in `true-blue.txt`.
    ```bash
    ./target/release/my_first_lm true-blue.txt -o true-blue.json -n 2 --scale-to-d120
    ```
    This command reads `true-blue.txt`, calculates bigram statistics, scales the counts for a d120 roll, and saves the result to `true-blue.json`.

    Or simply:
    ```bash
    ./target/release/my_first_lm true-blue.txt --scale-to-d120
    ```
    This command will save the result to the default filename `model.json`.

3.  **Generate the Booklet:**
    The `book.typ` file is designed to read the statistics from a file named `out.json` in the same directory. Rename your generated JSON file to `out.json` (or create a symbolic link):
    ```bash
    # If you kept the default model.json name
    mv model.json out.json
    # Or if you generated a custom-named file in the previous step
    # mv true-blue.json out.json
    ```
    Now, compile the Typst file to create the PDF booklet:
    ```bash
    typst compile book.typ book.pdf
    ```
    The final, printable booklet will be in `book.pdf`. Print it out, cut it up, and follow the assembly instructions (you might need to devise these!) to create your physical language model.

## Author

Ben Swift

This work is a project of the _Cybernetic Studio_ at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Source text licenses used as input for the language model remain as described in their original sources.
