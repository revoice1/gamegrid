'use client'

import { GameHeader } from './game-header'
import { HowToPlayModal } from './how-to-play-modal'
import { AchievementsModal } from './achievements-modal'
import {
  VersusSetupModal,
  type VersusCategoryFilters,
  type VersusStealRule,
  type VersusTurnTimerOption,
} from './versus-setup-modal'

type GameMode = 'practice' | 'versus'
type TicTacToePlayer = 'x' | 'o'

interface ModeStartScreenProps {
  mode: GameMode
  guessesRemaining: number
  score: number
  currentPlayer: TicTacToePlayer
  winner: TicTacToePlayer | 'draw' | null
  versusRecord: { xWins: number; oWins: number }
  isHowToPlayOpen: boolean
  isAchievementsOpen: boolean
  hasActiveCustomSetup: boolean
  minimumCellOptions: number | null
  dailyResetLabel: string
  showPracticeSetup: boolean
  showVersusSetup: boolean
  practiceSetupError: string | null
  versusSetupError: string | null
  practiceCategoryFilters: VersusCategoryFilters
  versusCategoryFilters: VersusCategoryFilters
  versusStealRule: VersusStealRule
  versusTimerOption: VersusTurnTimerOption
  versusDisableDraws: boolean
  onModeChange: (mode: 'daily' | 'practice' | 'versus') => void
  onAchievementsOpen: () => void
  onAchievementsClose: () => void
  onHowToPlayOpen: () => void
  onHowToPlayClose: () => void
  onOpenPracticeSetup: () => void
  onOpenVersusSetup: () => void
  onClosePracticeSetup: () => void
  onCloseVersusSetup: () => void
  onStartStandard: () => void
  onApplyPracticeFilters: (
    filters: VersusCategoryFilters,
    stealRule: VersusStealRule,
    timerOption: VersusTurnTimerOption,
    disableDraws: boolean
  ) => void
  onApplyVersusFilters: (
    filters: VersusCategoryFilters,
    stealRule: VersusStealRule,
    timerOption: VersusTurnTimerOption,
    disableDraws: boolean
  ) => void
}

export function ModeStartScreen({
  mode,
  guessesRemaining,
  score,
  currentPlayer,
  winner,
  versusRecord,
  isHowToPlayOpen,
  isAchievementsOpen,
  hasActiveCustomSetup,
  minimumCellOptions,
  dailyResetLabel,
  showPracticeSetup,
  showVersusSetup,
  practiceSetupError,
  versusSetupError,
  practiceCategoryFilters,
  versusCategoryFilters,
  versusStealRule,
  versusTimerOption,
  versusDisableDraws,
  onModeChange,
  onAchievementsOpen,
  onAchievementsClose,
  onHowToPlayOpen,
  onHowToPlayClose,
  onOpenPracticeSetup,
  onOpenVersusSetup,
  onClosePracticeSetup,
  onCloseVersusSetup,
  onStartStandard,
  onApplyPracticeFilters,
  onApplyVersusFilters,
}: ModeStartScreenProps) {
  const isPracticeStart = mode === 'practice'

  return (
    <main id="top" className="min-h-screen px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <GameHeader
          mode={mode}
          guessesRemaining={guessesRemaining}
          score={score}
          currentPlayer={currentPlayer}
          winner={winner}
          versusRecord={versusRecord}
          isHowToPlayOpen={isHowToPlayOpen}
          isAchievementsOpen={isAchievementsOpen}
          hasActiveCustomSetup={hasActiveCustomSetup}
          onModeChange={onModeChange}
          onAchievements={onAchievementsOpen}
          onHowToPlay={onHowToPlayOpen}
          onNewGame={undefined}
          onCustomizeGame={isPracticeStart ? onOpenPracticeSetup : onOpenVersusSetup}
        />
      </div>

      <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-border bg-card/80 p-6 text-center shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          {isPracticeStart ? 'Practice Mode' : 'Versus Mode'}
        </p>
        <h2 className="mt-3 text-2xl font-bold text-foreground">How do you want to start?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPracticeStart
            ? 'Launch a standard solo board right away, or customize the category pool first.'
            : 'Launch a standard head-to-head board right away, or customize the category pool and steal rules first.'}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onStartStandard}
            className="rounded-2xl border border-border bg-secondary/40 px-4 py-4 text-left transition-colors hover:bg-secondary/65"
          >
            <p className="text-sm font-semibold text-foreground">
              {isPracticeStart ? 'Standard Puzzle' : 'Standard Match'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPracticeStart
                ? 'Use the default solo category pool and jump right in.'
                : 'Use the default versus rules and random category families.'}
            </p>
          </button>
          <button
            onClick={isPracticeStart ? onOpenPracticeSetup : onOpenVersusSetup}
            className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-left transition-colors hover:bg-primary/15"
          >
            <p className="text-sm font-semibold text-foreground">
              {isPracticeStart ? 'Custom Puzzle' : 'Custom Match'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPracticeStart
                ? 'Pick the families you want in the solo category pool before generating.'
                : 'Pick families, tune steals, and set an optional turn timer.'}
            </p>
          </button>
        </div>
      </div>

      <VersusSetupModal
        isOpen={showPracticeSetup}
        onClose={onClosePracticeSetup}
        mode="practice"
        errorMessage={practiceSetupError}
        filters={practiceCategoryFilters}
        stealRule="lower"
        timerOption="none"
        disableDraws={false}
        onApply={onApplyPracticeFilters}
      />

      <VersusSetupModal
        isOpen={showVersusSetup}
        onClose={onCloseVersusSetup}
        mode="versus"
        errorMessage={versusSetupError}
        filters={versusCategoryFilters}
        stealRule={versusStealRule}
        timerOption={versusTimerOption}
        disableDraws={versusDisableDraws}
        onApply={onApplyVersusFilters}
      />

      <AchievementsModal isOpen={isAchievementsOpen} onClose={onAchievementsClose} />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={onHowToPlayClose}
        mode={mode}
        minimumCellOptions={minimumCellOptions}
        validationStatus={undefined}
        dailyResetLabel={dailyResetLabel}
      />
    </main>
  )
}
