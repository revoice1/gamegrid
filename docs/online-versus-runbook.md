# Online Versus Runbook

Use this when online-versus QA goes weird and you need the fastest path to a likely root cause.

## Table Of Contents

- [Authority Model](#authority-model)
- [High-Value QA Matrix](#high-value-qa-matrix)
- [Common Symptoms](#common-symptoms)
- [Useful Logs](#useful-logs)

## Authority Model

- `host_session_id` / `guest_session_id` stay stable for the room lifetime.
- `state_data.roleAssignments` decides who is currently `X` and `O`.
- Host-only routes still own:
  - `Continue In Room`
  - puzzle publish / board prep
  - end-room flow
- Gameplay auth follows current `X/O`:
  - `claim`
  - `miss`
  - `steal`
  - `objection`
- Live sync comes from `versus_events`.
- Reload/rejoin persistence comes from the host-written room snapshot.

## High-Value QA Matrix

Run these before merging risky online-versus changes:

1. Host wins game 1, continues room, and remains host.
2. Guest (`O`) wins game 1, host continues room, guest becomes next match `X`.
3. Host as `O` can still prepare/publish the rematch board.
4. Opponent miss triggers a visible `Your turn` cue on the remote side.
5. Sustained objection on a normal claim applies the corrected square.
6. Sustained objection on a steal resolves showdown and flips or fails authoritatively.
7. Host ends room and guest can dismiss the finished-room UI without a soft lock.

## Common Symptoms

### Both players think it is the other player's turn

Usually means one of:

- stale room snapshot overwrote live state
- role refresh after rematch advance did not run
- host-owned snapshot save did not land after the last state change

### Guest sees `Only the host can set the puzzle`

Usually means room-control logic leaked onto `X/O` logic again.

Expected behavior:

- host always owns puzzle publish
- winner may become next match `X`

### Sustained objection returns to metadata modal

Usually means the objection event validated, but authoritative application failed later.

Common buckets:

- proof missing from online objection payload
- proof verification failed
- authoritative objection payload never inserted

### Stealable cell or lock state looks stale after a miss or objection

Usually means one side missed an authoritative room snapshot update or replayed a stale event source.

## Useful Logs

### `/api/objection`

- `Objection review dataset summary`
- `Gemini objection request`
- `Gemini objection verdict`
- `Gemini objection response was not parseable`

Good for:

- model compliance issues
- grounded empty-content failures
- whether the objection really sustained or overruled

### `/api/versus/event`

- `Online versus event validation failed`
- `Online versus objection validated`
- `Online versus objection authoritative build failed`
- `Online versus objection authoritative payload`
- `Online versus objection inserted`

Good for:

- wrong-turn / stale-match / objection-limit rejections
- proving whether the objection got past validation
- proving whether the authoritative payload was actually inserted

### Client-side signals worth checking

- current `TURN` pill
- `YOU X/O` badge
- `Continue In Room` visibility
- whether the lobby stays open while the host prepares a board
- whether remote players get the `Your turn` toast after a miss
