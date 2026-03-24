# Game Rules

## Modes

### Daily

- One shared board per UTC day.
- The board is stored in Supabase and reused after the first successful generation.
- Daily state is restored locally for the current browser session history.
- Daily completions are recorded for stats and rarity scoring.

### Practice

- Boards are generated on demand and are not stored as canonical shared puzzles.
- Practice progress is restored from local storage.
- Results are local-only and do not include daily copy/playerbase features.

### Versus

- Versus is local-only.
- State is restored from local storage.
- Players alternate turns on the same board.
- The board can surface steal opportunities, timer pressure, and end-of-match states.

## Guess Rules

- A correct answer must satisfy both its row and column categories.
- Each game can only be used once per board.
- Search selection is not the same as correctness. Correctness is decided by backend validation.
- Search can hide metadata that would directly overlap with the active puzzle categories.
- Same-name ports can be hidden from search when they are just duplicate clutter.
- Selected guesses can still validate against an original-plus-official-ports family when that
  makes platform or release-history matching more faithful.

## Daily Timing

- "Today" is based on UTC, using the server date string from `toISOString()`.
- Multiple users can hit the daily route at midnight UTC.
- The database unique constraint on `puzzles.date` prevents split-brain daily boards.
- There is still a small generation race where multiple requests may do expensive work before one insert wins.

## Versus Rules

### Turn Flow

- One player is active at a time.
- The turn pill should show the active player clearly without overpowering the rest of the header.
- Optional timer pressure applies only when versus timers are enabled.

### Steals

- A stealable cell can be challenged by the other player.
- Steal success is determined by the configured steal rule.
- Steal resolution is handled by extracted pure logic, not inline component branching.

### Final Steal

- During the final steal window, only the target cell should be interactable.
- Non-target cells dim back visually.
- The target cell gets a stronger pulse so the board reads as a focused last-chance state.
- If versus alarms are disabled, the audio/alert treatment should be quiet or absent.

## Completion States

### Daily / Practice

- Completion is driven by filling the board or exhausting guesses.
- Daily results can show copy/share and playerbase features.
- Practice results stay local and simpler.

### Versus

- A match can end in an `X` win, an `O` win, or a draw.
- Custom versus can disable draws and award the match to the player with more claimed cells when a
  full board has no line.
- The winner panel should be dismissible without hiding the finished board.

## Achievements And Easter Eggs

- Achievements are intentionally part of the product identity, not an afterthought.
- Hidden trigger games can unlock themed achievements.
- Example recent additions:
  - `Rub It!` for `The Rub Rabbits!`
  - `Real Stinker` for a correct answer with a sub-50 Metacritic score
