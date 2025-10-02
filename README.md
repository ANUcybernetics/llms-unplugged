# My First LM

Can you make your own language model---from scratch---in 20 minutes with just
pen and paper? This repo contains a couple of software tools to help answer that
question. (Spoiler: yep.)

The repo contains:

- a Typst file (`lm-grid.typ`) and instructions (`instructions.typ`) for
  creating a word co-occurence matrix that can be used as a
  [bigram language model](https://en.wikipedia.org/wiki/Word_n-gram_language_model).

- a command-line tool (written in Rust) for processing a text corpus and
  typesetting it into an "N-gram model book", which can then be used for all
  sorts of fun things (e.g. dice-roll-powered proto-ChatGPT)

Why? Because it helps to make a simple version of something by hand to better
understand what's going on.

This is a [Cybernetic Studio](https://github.com/ANUcybernetics/) artefact by
[Ben Swift](https://benswift.me) as part of the _Human-Scale AI_ project.

## Installation

You will need:

1.  **Rust:** Install the Rust toolchain (including `cargo`) from
    [https://rustup.rs/](https://rustup.rs/).
2.  **Typst:** Install [Typst](https://typst.app/) from
    [https://github.com/typst/typst/](https://github.com/typst/typst/).

To generate the grid & instructions for the DIY version of this procedure,
simply typeset the `lm-grid.typ` and `instructions.typ` files and you're done.

To produce an N-gram book, read on...

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
    - `--scale-d <D>`: Integer value `D` to control count scaling (default: 10).
      - For `D = 10`: Always scales to the range `[0, 9]` to match physical d10
        dice (which are numbered 0-9). This allows direct use of d10 rolls
        without mental conversion.
      - For other `D` values: If a prefix has ≤ `D` unique followers, scales to
        the range `[1, D]`. The total count for the prefix in the JSON will be
        `D`. This is useful to tailor the output to the specific die you intend
        to use for random sampling.
      - If a prefix has more unique followers than `D`, its follower counts are
        scaled to the range `[0, 10^k - 1]`, where `k` is the number of digits
        in the original total follower count for that prefix. The total count in
        the JSON becomes `10^k - 1`. To sample a next word from these prefixes,
        roll the correct amount of d10 dice (indicated by a ♢ next to the word
        when more than one die is needed).
    - `--raw`: Output raw counts without any scaling. This overrides the
      `--scale-d` parameter if both are provided.

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

    If you omit `--scale-d`, the default value of 10 is used (optimized for d10
    dice).

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
[LICENSE](./LICENSE) file for details.

Documentation (in `docs/`) and any typeset "N-gram model booklets" are licenced
under a CC BY-NC-SA 4.0 license. See [docs/LICENSE](./docs/LICENSE) for the full
license text.

Source text licenses used as input for the language model remain as described in
their original sources.
