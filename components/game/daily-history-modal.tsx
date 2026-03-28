'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface DailyArchiveEntry {
  id: string
  date: string
  isCompleted?: boolean
  guessCount?: number
}

interface DailyHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  entries: DailyArchiveEntry[]
  isLoading?: boolean
  errorMessage?: string | null
  currentDate?: string | null
  onSelect: (entry: DailyArchiveEntry) => void
}

export function DailyHistoryModal({
  isOpen,
  onClose,
  entries,
  isLoading = false,
  errorMessage = null,
  currentDate = null,
  onSelect,
}: DailyHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border bg-card/95 p-0 backdrop-blur-sm">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-2xl font-bold text-foreground">Daily Archive</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Jump back into any stored daily board you missed.
          </p>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Loading archive…</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Couldn&apos;t load the archive.</p>
              <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No archived dailies yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Older daily boards will show up here once they exist in the database.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const isCurrentBoard = currentDate === entry.date
                const statusLabel = isCurrentBoard
                  ? 'Current'
                  : entry.isCompleted
                    ? 'Completed'
                    : (entry.guessCount ?? 0) > 0
                      ? 'In Progress'
                      : 'Play'

                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    className="w-full rounded-2xl border border-border bg-secondary/20 px-4 py-4 text-left transition-colors hover:bg-secondary/35"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          {entry.date}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                        {statusLabel}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
