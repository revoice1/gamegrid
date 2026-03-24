# Open Questions

These are the main places where product intent and implementation may still want another pass.

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

## Documentation Maintenance

- These docs are only useful if they stay close to real behavior.
- When a rule changes, update the docs in the same PR if the change is user-facing or system-shaping.
