ALTER TABLE guesses
  ADD COLUMN IF NOT EXISTS objection_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS objection_verdict TEXT,
  ADD COLUMN IF NOT EXISTS objection_explanation TEXT,
  ADD COLUMN IF NOT EXISTS objection_original_matched_row BOOLEAN,
  ADD COLUMN IF NOT EXISTS objection_original_matched_col BOOLEAN;
