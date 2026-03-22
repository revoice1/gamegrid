'use client'

import { getIndexBadge, type IndexBadgeSlot } from '@/lib/route-index'
import { cn } from '@/lib/utils'

export function IndexBadge({ slot, className }: { slot: IndexBadgeSlot; className?: string }) {
  const badge = getIndexBadge(slot)

  return (
    <span
      data-testid={`index-badge-${slot}`}
      className={cn(
        'inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80',
        className
      )}
    >
      <span>{`${badge.index}${badge.letter}`}</span>
    </span>
  )
}
