ALTER TABLE versus_rooms
  ADD COLUMN IF NOT EXISTS match_number INTEGER NOT NULL DEFAULT 1;

ALTER TABLE versus_events
  ADD COLUMN IF NOT EXISTS match_number INTEGER;

UPDATE versus_events
SET match_number = 1
WHERE match_number IS NULL;

ALTER TABLE versus_events
  ALTER COLUMN match_number SET NOT NULL;

CREATE INDEX IF NOT EXISTS versus_events_room_match_number_id_idx
  ON versus_events(room_id, match_number, id);
