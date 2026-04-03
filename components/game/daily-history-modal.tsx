'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

type DailyArchiveStatus = 'current' | 'completed' | 'in-progress' | 'not-started'

interface CalendarDayCell {
  day: number
  entry: DailyArchiveEntry
  status: DailyArchiveStatus
  isToday: boolean
}

interface CalendarMonthSection {
  key: string
  label: string
  cells: Array<CalendarDayCell | null>
  boardCount: number
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function parseArchiveDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function getArchiveStatus(
  entry: DailyArchiveEntry,
  currentDate: string | null
): DailyArchiveStatus {
  if (currentDate === entry.date) {
    return 'current'
  }

  if (entry.isCompleted) {
    return 'completed'
  }

  if ((entry.guessCount ?? 0) > 0) {
    return 'in-progress'
  }

  return 'not-started'
}

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function buildCalendarSections(
  entries: DailyArchiveEntry[],
  currentDate: string | null
): CalendarMonthSection[] {
  const todayDate = getTodayDateKey()
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const sections = new Map<string, CalendarMonthSection>()

  for (const entry of sortedEntries) {
    const parsedDate = parseArchiveDate(entry.date)
    const monthKey = `${parsedDate.getUTCFullYear()}-${parsedDate.getUTCMonth()}`

    if (!sections.has(monthKey)) {
      const firstDayOfMonth = new Date(
        Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), 1)
      )
      const leadingEmptyCells = firstDayOfMonth.getUTCDay()
      const daysInMonth = new Date(
        Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth() + 1, 0)
      ).getUTCDate()

      sections.set(monthKey, {
        key: monthKey,
        label: getMonthLabel(parsedDate),
        cells: Array.from({ length: leadingEmptyCells + daysInMonth }, () => null),
        boardCount: 0,
      })
    }

    const section = sections.get(monthKey)!
    const firstDayOffset = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), 1)
    ).getUTCDay()

    section.cells[firstDayOffset + parsedDate.getUTCDate() - 1] = {
      day: parsedDate.getUTCDate(),
      entry,
      status: getArchiveStatus(entry, currentDate),
      isToday: entry.date === todayDate,
    }
    section.boardCount += 1
  }

  return Array.from(sections.values()).sort((a, b) => a.key.localeCompare(b.key))
}

function getStatusLegendClass(status: DailyArchiveStatus): string {
  if (status === 'completed') {
    return 'border-emerald-400/35 bg-emerald-400/12 text-emerald-200'
  }

  if (status === 'in-progress') {
    return 'border-amber-400/35 bg-amber-400/12 text-amber-200'
  }

  return 'border-border bg-secondary/25 text-muted-foreground'
}

function getStatusCellClass(status: DailyArchiveStatus): string {
  if (status === 'current') {
    return 'border-primary/45 bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
  }

  if (status === 'completed') {
    return 'border-emerald-400/35 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/18'
  }

  if (status === 'in-progress') {
    return 'border-amber-400/35 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18'
  }

  return 'border-border bg-secondary/18 text-foreground hover:bg-secondary/32'
}

function getTodayCellAccent(isToday: boolean): string {
  return isToday ? 'ring-1 ring-sky-300/70' : ''
}

function getStatusLabel(status: DailyArchiveStatus): string {
  if (status === 'current') return 'Current board'
  if (status === 'completed') return 'Completed'
  if (status === 'in-progress') return 'In progress'
  return 'Not started'
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
  const calendarSections = buildCalendarSections(entries, currentDate)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen || isLoading || entries.length === 0) {
      return
    }

    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [entries.length, isLoading, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden border-border bg-card/95 p-0 backdrop-blur-sm">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-2xl font-bold text-foreground">Daily Archive</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Catch up on missed boards with a calendar view of your archive status.
          </DialogDescription>
        </DialogHeader>

        {entries.length > 0 && !isLoading && !errorMessage ? (
          <div className="border-b border-border px-6 py-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/12 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Archive Calendar
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusLegendClass('completed')}`}
                  >
                    Completed
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusLegendClass('in-progress')}`}
                  >
                    In Progress
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusLegendClass('not-started')}`}
                  >
                    Not Started
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Open</span> marks the board you have
                loaded right now. <span className="font-medium text-foreground">Today</span> marks
                the real current daily.
              </p>
            </div>
          </div>
        ) : null}

        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Loading archive...</p>
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
            <div className="space-y-6">
              {calendarSections.map((section) => (
                <section
                  key={section.key}
                  aria-label={section.label}
                  className="rounded-2xl border border-border bg-secondary/12 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                      {section.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">{section.boardCount} boards</p>
                  </div>

                  <div className="mb-2 grid grid-cols-7 gap-2">
                    {WEEKDAY_LABELS.map((label) => (
                      <div
                        key={label}
                        className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {section.cells.map((cell, index) =>
                      cell ? (
                        <button
                          key={cell.entry.id}
                          onClick={() => onSelect(cell.entry)}
                          className={`relative aspect-square rounded-xl border text-sm font-semibold transition-colors ${getStatusCellClass(cell.status)} ${getTodayCellAccent(cell.isToday)}`}
                          title={`${cell.entry.date} - ${getStatusLabel(cell.status)}${cell.isToday ? ' - Today' : ''}`}
                          aria-label={`${cell.entry.date}, ${getStatusLabel(cell.status)}${cell.isToday ? ', Today' : ''}`}
                        >
                          <span className="absolute left-2 top-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          <span>{cell.day}</span>
                          {cell.status === 'current' ? (
                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-[0.12em]">
                              Open
                            </span>
                          ) : null}
                          {cell.isToday ? (
                            <span className="absolute right-1.5 top-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-sky-200">
                              Today
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <div
                          key={`${section.key}-empty-${index}`}
                          aria-hidden="true"
                          className="aspect-square rounded-xl border border-transparent"
                        />
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
