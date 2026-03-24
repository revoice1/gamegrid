# Search And Validation

## Search Goals

- Make it easy to find the intended game quickly.
- Avoid accidental feel-bads where possible.
- Do not hand the player the answer.

## Search Metadata Scrubbing

When a puzzle is active, search results can scrub metadata families that overlap with the current board.

Examples:

- If `platform` is active on the board, search should not openly advertise platform metadata in the normal result row.
- If `decade` is active on the board, release date/year can be scrubbed in the normal metadata row.

This is a product choice, not just a data concern.

## Duplicate-Title Disambiguation

- Exact duplicate visible titles should be disambiguated.
- The current behavior uses `(Platform)` in the title line for duplicate results only.
- This is intentionally narrow:
  - exact duplicate titles in the current result set
  - not franchise-wide fuzzy grouping

Examples:

- `Super Mario Bros. (NES)`
- `Super Mario Bros. (SNES)`

## Guess Validation

- Search results are suggestions.
- Correctness is decided by backend validation against the selected cell categories.
- Validation is based on structured game data plus curated category rules.

## Company Validation

- `Company` is union-based: a game counts if the company developed it or published it.
- Alias buckets are applied on the backend so player-facing labels can stay clean.

## Count Paths

- Native IGDB count clauses are preferred whenever possible.
- Company amalgams now use native OR-style count clauses.
- Key merged platform buckets also use native ID-backed count clauses.
- Falling back to post-filter counting is slower and should be reduced over time.

## Generation Feedback

- First validation pass shows `OK` for passing intersections.
- Failed intersections show `X` plus the failing count.
- Later metadata/counting replaces `OK` with the exact number for passed cells.

This is intentional so the player sees progress early without losing the final cell-count detail.
