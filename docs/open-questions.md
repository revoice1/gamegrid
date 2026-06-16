# Open Questions

These are the main places where product intent and implementation may still want another pass.

## Table Of Contents

- [Platform Count Paths](#platform-count-paths)
- [Pair Smoothing](#pair-smoothing)
- [Tag Cleanup](#tag-cleanup)
- [Daily Midnight Efficiency](#daily-midnight-efficiency)
- [Online Versus E2E Coverage](#online-versus-e2e-coverage)
- [Documentation Maintenance](#documentation-maintenance)

## Platform Count Paths

- Some merged platform handling is much better now.
- There may still be opportunities to move more platform logic onto native ID-backed count clauses.

## Pair Smoothing

- Inter-family bans are wired in.
- Intra-family smoothing has not been fully explored yet.
- The right question is not just "what returns zero?" but also "what makes standard generation feel healthier?"

## Tag Cleanup

- Tag categories are no longer exposed in the product.
- Some tag validation/type logic still exists as compatibility ballast.
- Decide later whether that should stay or be deliberately removed.

## Daily Midnight Efficiency

- Correctness is protected by the unique daily puzzle row.
- Expensive generation work can still race at midnight UTC before one insert wins.
- A future DB lock/claim flow could reduce wasted work.

## Online Versus E2E Coverage

- Unit and route tests cover most of the online authority model now.
- Full two-client end-to-end room play is still only partially simulated because Supabase Realtime
  is not present in the current Playwright environment.
- If online-versus work keeps growing, a richer multi-client test harness or a Realtime-friendly
  test environment may become worth the setup cost.

## Documentation Maintenance

- These docs are only useful if they stay close to real behavior.
- When a rule changes, update the docs in the same PR if the change is user-facing or system-shaping.
