-- GameGrid Database Schema
-- Puzzles table for daily/practice puzzles
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE,
  is_daily BOOLEAN NOT NULL DEFAULT false,
  row_categories JSONB NOT NULL,
  col_categories JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guesses table to track all user guesses
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  cell_index INTEGER NOT NULL CHECK (cell_index >= 0 AND cell_index <= 8),
  game_id INTEGER NOT NULL,
  game_name TEXT NOT NULL,
  game_image TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer stats for faster rarity calculations
CREATE TABLE IF NOT EXISTS answer_stats (
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  cell_index INTEGER NOT NULL CHECK (cell_index >= 0 AND cell_index <= 8),
  game_id INTEGER NOT NULL,
  game_name TEXT NOT NULL,
  game_image TEXT,
  count INTEGER DEFAULT 1,
  PRIMARY KEY (puzzle_id, cell_index, game_id)
);

-- Puzzle completions to track how many finished each puzzle
CREATE TABLE IF NOT EXISTS puzzle_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 9),
  rarity_score DECIMAL(10,2),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(puzzle_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle_id ON guesses(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_guesses_session_id ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle_cell ON guesses(puzzle_id, cell_index);
CREATE INDEX IF NOT EXISTS idx_answer_stats_puzzle_cell ON answer_stats(puzzle_id, cell_index);
CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(date);
CREATE INDEX IF NOT EXISTS idx_puzzles_daily ON puzzles(is_daily, date);
CREATE INDEX IF NOT EXISTS idx_completions_puzzle ON puzzle_completions(puzzle_id);

-- Enable Row Level Security but allow all operations for anonymous users
-- (we use session_id for tracking, not auth)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_completions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (anonymous game play)
CREATE POLICY "Allow public read puzzles" ON puzzles FOR SELECT USING (true);
CREATE POLICY "Allow public insert puzzles" ON puzzles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read guesses" ON guesses FOR SELECT USING (true);
CREATE POLICY "Allow public insert guesses" ON guesses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read answer_stats" ON answer_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert answer_stats" ON answer_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update answer_stats" ON answer_stats FOR UPDATE USING (true);

CREATE POLICY "Allow public read completions" ON puzzle_completions FOR SELECT USING (true);
CREATE POLICY "Allow public insert completions" ON puzzle_completions FOR INSERT WITH CHECK (true);
