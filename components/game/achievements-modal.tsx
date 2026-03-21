'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ACHIEVEMENTS,
  loadUnlockedAchievementEntries,
  loadUnlockedAchievementIds,
} from '@/lib/achievements'
import { useEffect, useState } from 'react'

interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>([])
  const [achievementImageMap, setAchievementImageMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setUnlockedAchievementIds(loadUnlockedAchievementIds())
    setAchievementImageMap(
      new Map(
        loadUnlockedAchievementEntries()
          .filter((entry): entry is { id: string; imageUrl: string } => Boolean(entry.imageUrl))
          .map((entry) => [entry.id, entry.imageUrl])
      )
    )
  }, [isOpen])

  const unlockedAchievementSet = new Set(unlockedAchievementIds)
  const unlockedCount = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievementSet.has(achievement.id)
  ).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Achievements</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {unlockedCount}/{ACHIEVEMENTS.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlock easter eggs and perfect runs to grow your collection.
            </p>
          </div>

          <div className="grid gap-2">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievementSet.has(achievement.id)
              const imageUrl = achievementImageMap.get(achievement.id)

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    'rounded-lg border px-3 py-3 transition-colors',
                    isUnlocked
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-background/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border',
                          isUnlocked
                            ? 'border-primary/30 bg-primary/15'
                            : 'border-border bg-background/70'
                        )}
                      >
                        {isUnlocked && imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span
                            className={cn(
                              'text-lg font-black uppercase',
                              isUnlocked ? 'text-primary' : 'text-muted-foreground'
                            )}
                          >
                            {achievement.title.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {achievement.title}
                        </p>
                        {isUnlocked && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em]',
                        isUnlocked
                          ? 'border-primary/30 bg-primary/15 text-primary'
                          : 'border-border bg-background/70 text-muted-foreground'
                      )}
                    >
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
