# My First LM

This project provides tools to process text, calculate N-gram statistics (like
word frequencies, but based on sequences of), and typeset an N-gram language
model booklet. You can use this to explore the statistical patterns in a text
corpus in a hands-on way by generating new text through dice rolling.

## Installation

You will need:

1.  **Rust:** Install the Rust toolchain (including `cargo`) from
    [https://rustup.rs/](https://rustup.rs/).
2.  **Typst:** Install [Typst](https://typst.app/) from
    [https://github.com/typst/typst/](https://github.com/typst/typst/).

## Usage

The process involves two main steps: generating the N-gram statistics from your
text file using the Rust program (writing them into a file called `model.json`)
and then typesetting those statistics into a booklet using Typst.

1.  **Build the Statistics Generator:** Navigate to the project directory in
    your terminal and build the Rust executable:

    ```bash
    cargo build --release
    ```

    This will create an executable file at `target/release/my_first_lm`.

2.  **Generate N-gram Statistics:** Run the compiled executable, providing your
    input text file and optionally specifying an output JSON file.

    ```bash
    ./target/release/my_first_lm <input_text_file> [OPTIONS]
    ```

    **Arguments:**

    - `<input_text_file>`: Path to the text file you want to analyze.

    **Options:**

    - `-o, --output <output_json_file>`: Path where the generated N-gram
      statistics (in JSON format) will be saved. Defaults to `model.json`.
    - `-n, --n <N>`: The size of the N-gram (e.g., `2` for bigrams, `3` for
      trigrams). Defaults to `2`.
    - `--scale-d <D>`: Optional integer value `D` to control count scaling.
      - If provided, and a prefix has a number of unique followers less than or
        equal to `D`, its follower counts are scaled to the range `[1, D]`. The
        total count for the prefix in the JSON will be `D`. This is useful to
        tailor the output to the specific die you intend to do for the random
        sampling.
      - If a prefix has more unique followers than `D`, or if `--scale-d` is not
        provided, its follower counts are scaled to the range `[0, 10^k - 1]`,
        where `k` is the number of digits in the original total follower count
        for that prefix. The total count in the JSON becomes `10^k - 1`. To
        sample a next word from these prefixes, roll the correct amound of d10
        (indicated by a ♢ next to the word).

    **Example (generating d20-style scaled bigram statistics):** Let's say you
    have your text in `true-blue.txt` and your die of choice is a d20:

    ```bash
    ./target/release/my_first_lm true-blue.txt -o true-blue.json -n 2 --scale-d 20
    ```

    This command reads `true-blue.txt`, calculates bigram statistics. For
    prefixes with 20 or fewer unique followers, it scales counts to the range
    [1, 20]. For other prefixes, it uses the `[0, 10^k-1]` scaling. The result
    is saved to `true-blue.json`.

    Or simply, to use `--scale-d 20` with the default output `model.json`:

    ```bash
    ./target/release/my_first_lm true-blue.txt --scale-d 20
    ```

    If you omit `--scale-d` entirely, all prefixes will use the `[0, 10^k-1]`
    scaling.

3.  **Generate the Booklet:** The `book.typ` file is designed to read the
    statistics from a file named `out.json` in the same directory. Rename your
    generated JSON file to `out.json` (or create a symbolic link):
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
    The final, printable booklet will be in `book.pdf`. Print it out, cut it up,
    and follow the assembly instructions (you might need to devise these!) to
    create your physical language model.

## A note on input data

The input data file must have a
[YAML frontmatter block](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter)
with string values for the following three keys:

- the `title` of the text
- the `author` of the text
- the `url` of the text

These values are passed through to the book frontmatter in the final typeset
pdf.

The tokenizer is deliberately very basic---all punctuation (except for
contraction apostrophes) are removed, and everything is lowercased except for a
few exceptions to do with personal pronouns. This is to ensure the final model
is as small as possible (for a given input text).

## Author

Ben Swift

This work is a project of the _Cybernetic Studio_ at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au).

## License

Source code for this project is licensed under the MIT License. See the
[LICENSE](LICENSE) file for details.

The typeset "N-gram model booklets" are licenced under a CC BY-NC 4.0 license.

Source text licenses used as input for the language model remain as described in
their original sources.
