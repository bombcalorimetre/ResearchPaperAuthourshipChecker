# ResearchPaperAuthourshipChecker
An database system to prevent ghost and honorary authorship
SimCheck — JSON Similarity Checker

SimCheck is a fully client-side web application for computing pairwise text similarity using multiple algorithms. It is lightweight, privacy-friendly, and requires no installation or backend setup.


Getting Started

Simply open the application in any modern web browser:

- Open index.html in:
  - Google Chrome
  - Mozilla Firefox
  - Microsoft Edge
  - Safari

No server, dependencies, or build steps are required.


Project Structure

index.html                  Main user interface
styles.css                 Dark theme stylesheet
similarity.js              Implementation of similarity algorithms
app.js                     Application logic (file upload, rendering, export)
sample_assignments.json    Sample dataset for testing


Supported JSON Formats

1. Array of Strings

[
  "text one here",
  "text two here",
  "text three here"
]

2. Array of Objects (Recommended)

[
  { "student": "Alice", "answer": "ER model uses entities..." },
  { "student": "Bob",   "answer": "The entity relationship diagram..." }
]

The application automatically detects text-heavy fields for comparison.


Similarity Algorithms

Cosine TF-IDF
- Description: Compares term frequency vectors in high-dimensional space
- Best for: Long texts and keyword overlap

Jaccard Index
- Description: Measures intersection over union of token sets
- Best for: Short to medium texts

Levenshtein Distance
- Description: Normalized edit distance between strings
- Best for: Detecting minor edits or copy-paste

Dice Coefficient
- Description: Bigram-based character similarity
- Best for: Detecting paraphrasing

LCS Ratio
- Description: Longest common subsequence of tokens
- Best for: Structural similarity

Ensemble Score
- A weighted combination of selected algorithms providing an overall similarity estimate


Output Features

Heatmap
- Visual matrix showing pairwise similarity scores for each algorithm

Pair Table
- Sortable table with detailed scores and risk classification

Top Matches
- Ranked list of the most similar text pairs

CSV Export
- Downloadable results for external analysis


Risk Classification

High    : 80% and above
Medium  : 50% to 79%
Low     : Below 50%


Key Features

- Fully client-side (no data leaves the browser)
- No installation or configuration required
- Multiple similarity algorithms supported
- Interactive and exportable results
- Flexible JSON input formats