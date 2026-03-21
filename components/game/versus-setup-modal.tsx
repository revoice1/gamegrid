'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type { CategoryType } from '@/lib/types'

type VersusFamilyKey = Extract<CategoryType, 'platform' | 'genre' | 'decade' | 'game_mode' | 'theme' | 'perspective'>

export interface VersusCategoryFamilyOption {
  key: VersusFamilyKey
  source: 'dynamic' | 'fallback'
  categories: Array<{
    id: string
    name: string
    type: CategoryType
    defaultChecked?: boolean
  }>
}

export type VersusCategoryFilters = Partial<Record<VersusFamilyKey, string[]>>
export type VersusStealRule = 'lower' | 'higher'
export type VersusTurnTimerOption = 'none' | 60 | 120 | 300
export type CustomBuildMode = 'auto' | 'full-custom'

export interface ExplicitCustomCategory {
  id: string
  name: string
  type: VersusFamilyKey
}

export interface FullCustomSelection {
  rows: ExplicitCustomCategory[]
  cols: ExplicitCustomCategory[]
}

interface VersusSetupModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'versus' | 'practice'
  errorMessage?: string | null
  filters: VersusCategoryFilters
  buildMode?: CustomBuildMode
  fullCustomSelection?: FullCustomSelection | null
  stealRule: VersusStealRule
  timerOption: VersusTurnTimerOption
  onApply: (
    filters: VersusCategoryFilters,
    buildMode: CustomBuildMode,
    fullCustomSelection: FullCustomSelection | null,
    stealRule: VersusStealRule,
    timerOption: VersusTurnTimerOption
  ) => void
}

const TIMER_OPTIONS: Array<{ value: VersusTurnTimerOption; label: string }> = [
  { value: 'none', label: 'No timer' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 300, label: '5 min' },
]

const FAMILY_LABELS: Record<VersusFamilyKey, string> = {
  platform: 'Platforms',
  genre: 'Genres',
  decade: 'Decades',
  game_mode: 'Modes',
  theme: 'Themes',
  perspective: 'Perspectives',
}

export function VersusSetupModal({
  isOpen,
  onClose,
  mode = 'versus',
  errorMessage = null,
  filters,
  buildMode = 'auto',
  fullCustomSelection = null,
  stealRule,
  timerOption,
  onApply,
}: VersusSetupModalProps) {
  const [families, setFamilies] = useState<VersusCategoryFamilyOption[]>([])
  const [draftFilters, setDraftFilters] = useState<VersusCategoryFilters>(filters)
  const [draftBuildMode, setDraftBuildMode] = useState<CustomBuildMode>(buildMode)
  const [draftFullCustomSelection, setDraftFullCustomSelection] = useState<FullCustomSelection>(
    fullCustomSelection ?? { rows: [], cols: [] }
  )
  const [draftStealRule, setDraftStealRule] = useState<VersusStealRule>(stealRule)
  const [draftTimerOption, setDraftTimerOption] = useState<VersusTurnTimerOption>(timerOption)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedFamilies, setExpandedFamilies] = useState<Partial<Record<VersusFamilyKey, boolean>>>({})

  useEffect(() => {
    setDraftFilters(filters)
    setDraftBuildMode(buildMode)
    setDraftFullCustomSelection(fullCustomSelection ?? { rows: [], cols: [] })
    setDraftStealRule(stealRule)
    setDraftTimerOption(timerOption)
  }, [buildMode, filters, fullCustomSelection, isOpen, stealRule, timerOption])

  useEffect(() => {
    if (!isOpen) {
      setExpandedFamilies({})
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || families.length > 0) {
      return
    }

    setIsLoading(true)
    fetch('/api/versus-options')
      .then((response) => response.json())
      .then((data) => setFamilies(data.families ?? []))
      .catch((error) => {
        console.error('Failed to load versus options:', error)
        setFamilies([])
      })
      .finally(() => setIsLoading(false))
  }, [families.length, isOpen])

  const getDefaultSelection = (family: VersusCategoryFamilyOption) => {
    return family.categories
      .filter((category) => category.defaultChecked !== false)
      .map((category) => category.id)
  }

  const getEffectiveSelection = (family: VersusCategoryFamilyOption) => {
    return draftFilters[family.key] ?? getDefaultSelection(family)
  }

  const enabledFamilyCount = useMemo(() => {
    return families.filter((family) => getEffectiveSelection(family).length > 0).length
  }, [draftFilters, families])

  const totalSelectedCategories = useMemo(() => {
    return families.reduce((sum, family) => sum + getEffectiveSelection(family).length, 0)
  }, [draftFilters, families])

  const toggleCategory = (familyKey: VersusFamilyKey, categoryId: string, checked: boolean) => {
    setDraftFilters((current) => {
      const family = families.find((entry) => entry.key === familyKey)
      const existing = current[familyKey] ?? (family ? getDefaultSelection(family) : [])
      const nextValues = checked
        ? Array.from(new Set([...existing, categoryId]))
        : existing.filter((value) => value !== categoryId)

      if (!family) {
        return current
      }

      if (nextValues.length === family.categories.length) {
        const { [familyKey]: _removed, ...rest } = current
        return rest
      }

      return {
        ...current,
        [familyKey]: nextValues,
      }
    })
  }

  const clearFamily = (familyKey: VersusFamilyKey) => {
    setDraftFilters((current) => {
      const { [familyKey]: _removed, ...rest } = current
      return rest
    })
  }

  const uncheckFamily = (familyKey: VersusFamilyKey) => {
    setDraftFilters((current) => ({
      ...current,
      [familyKey]: [],
    }))
  }

  const toggleFamilyExpanded = (familyKey: VersusFamilyKey) => {
    setExpandedFamilies((current) => ({
      ...current,
      [familyKey]: !current[familyKey],
    }))
  }

  const toggleExplicitSelection = (
    side: 'rows' | 'cols',
    category: ExplicitCustomCategory
  ) => {
    setDraftFullCustomSelection((current) => {
      const existing = current[side]
      const alreadySelected = existing.some((item) => item.id === category.id && item.type === category.type)

      if (alreadySelected) {
        return {
          ...current,
          [side]: existing.filter((item) => !(item.id === category.id && item.type === category.type)),
        }
      }

      if (existing.length >= 3) {
        return current
      }

      return {
        ...current,
        [side]: [...existing, category],
      }
    })
  }

  const resetToDefault = () => {
    setDraftFilters({})
    setDraftBuildMode('auto')
    setDraftFullCustomSelection({ rows: [], cols: [] })
    setDraftStealRule('lower')
    setDraftTimerOption('none')
  }

  const canApply =
    draftBuildMode === 'full-custom'
      ? draftFullCustomSelection.rows.length === 3 && draftFullCustomSelection.cols.length === 3
      : enabledFamilyCount >= 4 && totalSelectedCategories >= 6
  const isVersusMode = mode === 'versus'
  const applyDisabledReason =
    draftBuildMode === 'full-custom'
      ? draftFullCustomSelection.rows.length !== 3
        ? 'Pick exactly 3 row categories for full custom.'
        : draftFullCustomSelection.cols.length !== 3
          ? 'Pick exactly 3 column categories for full custom.'
          : null
      : enabledFamilyCount < 4
        ? `Enable at least 4 families to generate a board.`
        : totalSelectedCategories < 6
          ? `Enable at least 6 total categories to generate a board.`
          : null

  const buildAppliedFilters = (): VersusCategoryFilters => {
    if (draftBuildMode === 'full-custom') {
      return {}
    }

    const nextFilters: VersusCategoryFilters = {}

    for (const family of families) {
      const selected = getEffectiveSelection(family)

      if (selected.length < family.categories.length) {
        nextFilters[family.key] = selected
      }
    }

    return nextFilters
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isVersusMode ? 'Versus Setup' : 'Practice Setup'}</DialogTitle>
          <DialogDescription>
            {draftBuildMode === 'full-custom'
              ? 'Pick all 3 rows and all 3 columns yourself. Full custom skips grid-building rules and only runs exact cell counts.'
              : 'Build your own category pool. You need at least 6 enabled categories across at least 4 families to try generation. Some narrow combinations may take more attempts to validate, or may not be able to generate a board at all.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Build Mode</h3>
              <p className="text-xs text-muted-foreground">
                Auto Grid builds a board from your enabled families. Full Custom lets you pick every row and column yourself.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/50 px-3 py-2">
              <span className={`text-xs font-medium ${draftBuildMode === 'auto' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Auto Grid
              </span>
              <Switch
                checked={draftBuildMode === 'full-custom'}
                onCheckedChange={(checked) => setDraftBuildMode(checked ? 'full-custom' : 'auto')}
                aria-label="Toggle full custom mode"
              />
              <span className={`text-xs font-medium ${draftBuildMode === 'full-custom' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Full Custom
              </span>
            </div>
          </div>
        </section>

        {isVersusMode && (
          <section className="rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Steal Rule</h3>
                <p className="text-xs text-muted-foreground">
                  Toggle whether a steal has to beat the defending square with a lower or higher rating.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/50 px-3 py-2">
                <span className={`text-xs font-medium ${draftStealRule === 'lower' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Lower wins
                </span>
                <Switch
                  checked={draftStealRule === 'higher'}
                  onCheckedChange={(checked) => setDraftStealRule(checked ? 'higher' : 'lower')}
                  aria-label="Toggle steal rule"
                />
                <span className={`text-xs font-medium ${draftStealRule === 'higher' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Higher wins
                </span>
              </div>
            </div>
          </section>
        )}

        {isVersusMode && (
          <section className="rounded-2xl border border-border bg-secondary/20 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Turn Timer</h3>
              <p className="text-xs text-muted-foreground">
                Set an optional shot clock for each turn. If time runs out, the turn passes.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIMER_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftTimerOption(option.value)}
                  className={draftTimerOption === option.value ? 'border-primary bg-primary/10 text-primary' : undefined}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>
        )}

        {draftBuildMode === 'full-custom' && (
          <section className="rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Rows</h3>
                <p className="text-xs text-muted-foreground">Pick exactly 3 row categories.</p>
                <div className="mt-3 flex min-h-16 flex-wrap gap-2">
                  {draftFullCustomSelection.rows.map((category) => (
                    <button
                      key={`row-${category.type}-${category.id}`}
                      type="button"
                      onClick={() => toggleExplicitSelection('rows', category)}
                      className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {category.name}
                    </button>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - draftFullCustomSelection.rows.length) }).map((_, index) => (
                    <span key={`row-slot-${index}`} className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground">
                      Empty
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Columns</h3>
                <p className="text-xs text-muted-foreground">Pick exactly 3 column categories.</p>
                <div className="mt-3 flex min-h-16 flex-wrap gap-2">
                  {draftFullCustomSelection.cols.map((category) => (
                    <button
                      key={`col-${category.type}-${category.id}`}
                      type="button"
                      onClick={() => toggleExplicitSelection('cols', category)}
                      className="rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300"
                    >
                      {category.name}
                    </button>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - draftFullCustomSelection.cols.length) }).map((_, index) => (
                    <span key={`col-slot-${index}`} className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground">
                      Empty
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading category pools...</div>
        ) : (
          <div className="space-y-5">
            {families.map((family) => {
              const selected = new Set(getEffectiveSelection(family))
              const isCustom = selected.size < family.categories.length
              const isExpanded = expandedFamilies[family.key] === true

              return (
                <section key={family.key} className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleFamilyExpanded(family.key)}
                      className="flex flex-1 items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{FAMILY_LABELS[family.key]}</h3>
                        <p className="text-xs text-muted-foreground">
                          {isCustom ? `${selected.size} of ${family.categories.length} enabled` : `All ${family.categories.length} enabled`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {isExpanded ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => uncheckFamily(family.key)}>
                        Uncheck All
                      </Button>
                      {isCustom && (
                        <Button variant="ghost" size="sm" onClick={() => clearFamily(family.key)}>
                          Check All
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {family.categories.map((category) => (
                        <div
                          key={`${family.key}-${category.id}`}
                          className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm"
                        >
                          {draftBuildMode === 'full-custom' ? (
                            <>
                              <span className="min-w-0 flex-1 text-foreground">{category.name}</span>
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    draftFullCustomSelection.rows.length >= 3 &&
                                    !draftFullCustomSelection.rows.some((item) => item.id === category.id && item.type === family.key)
                                  }
                                  className={draftFullCustomSelection.rows.some((item) => item.id === category.id && item.type === family.key) ? 'border-primary bg-primary/10 text-primary' : undefined}
                                  onClick={() => toggleExplicitSelection('rows', { id: category.id, name: category.name, type: family.key })}
                                >
                                  Row
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    draftFullCustomSelection.cols.length >= 3 &&
                                    !draftFullCustomSelection.cols.some((item) => item.id === category.id && item.type === family.key)
                                  }
                                  className={draftFullCustomSelection.cols.some((item) => item.id === category.id && item.type === family.key) ? 'border-sky-400 bg-sky-400/10 text-sky-300' : undefined}
                                  onClick={() => toggleExplicitSelection('cols', { id: category.id, name: category.name, type: family.key })}
                                >
                                  Col
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Checkbox
                                checked={selected.has(category.id)}
                                onCheckedChange={(checked) => toggleCategory(family.key, category.id, checked === true)}
                              />
                              <span className="text-foreground">{category.name}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Current pool: {totalSelectedCategories} enabled categories across {enabledFamilyCount} families. Narrower pools can take longer to generate.
            </p>
            {applyDisabledReason && (
              <p className="text-xs font-medium text-amber-300">
                {applyDisabledReason}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetToDefault}>
              Reset to Default
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => onApply(
                buildAppliedFilters(),
                draftBuildMode,
                draftBuildMode === 'full-custom' ? draftFullCustomSelection : null,
                draftStealRule,
                draftTimerOption
              )}
              disabled={!canApply}
              title={applyDisabledReason ?? undefined}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
