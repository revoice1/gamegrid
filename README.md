# GameGrid

A daily video game trivia grid game where every answer must satisfy both its row and column category.

GameGrid includes:

- a daily puzzle
- a daily archive for catching up on missed boards
- streak and completion tracking for daily play
- unlimited practice boards
- local versus play
- post-match versus summaries
- curated category pools for standard play
- customizable category pools for practice and versus
- search metadata, easter eggs, and local achievements

## How This Was Built

GameGrid has been built through a design-directed vibe coding workflow: fast iteration with a strong
human point of view on feel, clarity, and play.

In practice that means the project has been shaped by:

- active playtesting, not just feature delivery
- rapid iteration between product direction and implementation
- treating interaction feel, pacing, readability, and surprise as first-class concerns
- keeping code quality, testing, and CI in the loop as features land

The goal is not to spray features onto the page. The goal is to make a trivia game that feels good
to play, is easy to read, and has enough personality to be worth returning to.

## Product Docs

For rules, category behavior, UX intent, and open alignment questions, see:

- [docs/README.md](./docs/README.md)

## Design Philosophy

- The board is the product. Supporting UI should stay out of the way unless it is helping the
  player make a decision.
- Clarity beats cleverness. Search, results, and customization should feel legible even when the
  rules get more complex.
- Playfulness matters. Easter eggs, achievements, celebrations, and versus drama are part of the
  identity of the project, not decoration added at the end.
- Shipping matters, but so does stewardship. New work should come with testing, validation, and a
  path to maintainability.

## Getting Started

Create a `.env.local` file from `.env.example`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable                         | Required | Description                                                                                                                   |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Yes      | Supabase project URL                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Yes      | Supabase anon key                                                                                                             |
| `TWITCH_IGDB_CLIENT_ID`          | Yes      | IGDB API client ID via the Twitch developer console                                                                           |
| `TWITCH_IGDB_CLIENT_SECRET`      | Yes      | IGDB API client secret                                                                                                        |
| `PUZZLE_MIN_VALID_OPTIONS`       | No       | Minimum valid answers per cell, default `3`                                                                                   |
| `PUZZLE_GENERATION_MAX_ATTEMPTS` | No       | Max candidate grids to try before failing, default `12`                                                                       |
| `PUZZLE_VALIDATION_SAMPLE_SIZE`  | No       | IGDB matches sampled when validating each cell, default `40`                                                                  |
| `ALLOWED_DEV_ORIGINS`            | No       | Comma-separated extra dev origins for remote local testing, for example `http://your-hostname:3000,http://your-local-ip:3000` |

## Database Setup

Run migrations in order against your Supabase project:

```text
scripts/001_create_tables.sql          - core schema (puzzles, guesses, stats)
scripts/002_add_increment_function.sql
scripts/003_add_guess_correctness.sql
scripts/004_add_cell_metadata.sql      - adds cell metadata to puzzles
```

## API Routes

| Route                                         | Description                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `GET /api/puzzle?mode=daily\|practice`        | Returns the current puzzle as JSON.                                |
| `GET /api/puzzle-stream?mode=daily\|practice` | Streams puzzle generation progress.                                |
| `GET /api/search?q=...`                       | Searches IGDB for games matching a query.                          |
| `POST /api/guess`                             | Validates a game guess against a cell's row and column categories. |
| `POST /api/stats`                             | Records a completed daily game session.                            |

## Notes

- Daily puzzles are stored and reused after generation.
- Daily progress is tied to an anonymous browser session so archived boards can reopen your saved
  state on the same device/browser.
- Practice puzzles are generated fresh and are not stored in the database.
- Versus matches are local-only and restored from local storage.
- Finished versus matches can expand into a post-game summary with the rules used, picks, and key
  match stats.
- Standard puzzle generation uses curated category families and prevalidated banned pairs to avoid
  dead intersections.
- Practice and versus custom setup start from curated defaults and let players opt into additional
  categories.
- Game data and guess validation are powered by IGDB.
- Search results hide metadata that would directly overlap with active puzzle categories, while
  still disambiguating exact duplicate titles.

## Testing

```bash
npm test
```

This is the canonical verification command for the repo. It runs:

- Prettier format check
- ESLint
- TypeScript typechecking
- Vitest unit/component tests
- Playwright end-to-end tests

Useful local commands:

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npx playwright test --headed
```

Git hooks are set up with Husky. On commit, `lint-staged` runs:

- `prettier --write` on staged supported files
- `eslint --fix` on staged JS/TS files

GitHub Actions CI validates format, lint, typecheck, unit tests, and Playwright end-to-end tests on every PR.

## Category Model

The board pulls from curated category families rather than a live IGDB category scrape.

Standard generation currently uses these families:

- Platform
- Genre
- Decade
- Company
- Game Mode
- Theme
- Perspective

Practice and versus custom setup reuse the same curated base, with a few extra categories exposed as
opt-in custom-only choices.

Notable category behavior:

- `Company` is a player-facing combined bucket: a game counts if the company developed it or
  published it.
- Merged platform buckets such as `NES`, `SNES`, and `PC (Windows/DOS)` use native platform ID
  groups for validation/counting.
- Standard generation uses a curated symmetric ban table for impossible inter-family pairings.

## Feedback

- Changelog: `/changelog`
- Daily archive and streak behavior: [app/how-to-play/page.tsx](./app/how-to-play/page.tsx)
- Bug reports: [github.com/revoice1/gamegrid/issues/new?template=bug_report.yml](https://github.com/revoice1/gamegrid/issues/new?template=bug_report.yml)
- Feature requests: [github.com/revoice1/gamegrid/issues/new?template=feature_request.yml](https://github.com/revoice1/gamegrid/issues/new?template=feature_request.yml)

GitHub issue forms automatically apply:

- `bug` for bug reports
- `enhancement` for feature requests
