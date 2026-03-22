function decodeShiftedChars(values: number[], shift: number) {
  return String.fromCharCode(...values.map((value) => value - shift))
}

export const ROUTE_SLUG = decodeShiftedChars([85, 80, 71, 85, 77, 80, 68, 76, 84], 1)
export const ROUTE_ACHIEVEMENT_ID = decodeShiftedChars(
  [117, 113, 104, 118, 110, 113, 101, 109, 117],
  2
)
export const ROUTE_PENDING_TOAST_KEY = decodeShiftedChars(
  [
    108, 100, 112, 104, 106, 117, 108, 103, 98, 118, 104, 102, 117, 104, 119, 98, 100, 102, 107,
    108, 104, 121, 104, 112, 104, 113, 119, 98, 119, 114, 100, 118, 119,
  ],
  4
)

export type IndexBadgeSlot =
  | 'col-0'
  | 'col-1'
  | 'col-2'
  | 'row-0'
  | 'row-1'
  | 'row-2'
  | 'settings'
  | 'setup'
  | 'achievements'

export interface IndexBadge {
  index: number
  letter: string
}

const INDEX_BADGE_MATRIX = [
  ['col-0', 4, 92],
  ['col-1', 1, 91],
  ['col-2', 8, 83],
  ['row-0', 5, 84],
  ['row-1', 2, 87],
  ['row-2', 9, 91],
  ['settings', 7, 79],
  ['setup', 3, 82],
  ['achievements', 6, 87],
] as const satisfies ReadonlyArray<readonly [IndexBadgeSlot, number, number]>

export const INDEX_BADGES: Record<IndexBadgeSlot, IndexBadge> = Object.fromEntries(
  INDEX_BADGE_MATRIX.map(([slot, index, encodedLetter]) => [
    slot,
    { index, letter: String.fromCharCode(encodedLetter - 8) },
  ])
) as Record<IndexBadgeSlot, IndexBadge>

export function getIndexBadge(slot: IndexBadgeSlot): IndexBadge {
  return INDEX_BADGES[slot]
}
