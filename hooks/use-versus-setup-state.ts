import { useState } from 'react'
import type {
  VersusCategoryFilters,
  VersusObjectionRule,
  VersusStealRule,
  VersusTurnTimerOption,
} from '@/components/game/versus-setup-modal'

export function useVersusSetupState() {
  const [versusCategoryFilters, setVersusCategoryFilters] = useState<VersusCategoryFilters>({})
  const [versusStealRule, setVersusStealRule] = useState<VersusStealRule>('lower')
  const [versusTimerOption, setVersusTimerOption] = useState<VersusTurnTimerOption>('none')
  const [versusDisableDraws, setVersusDisableDraws] = useState(false)
  const [versusObjectionRule, setVersusObjectionRule] = useState<VersusObjectionRule>('off')
  const [showVersusSetup, setShowVersusSetup] = useState(false)
  const [showVersusStartOptions, setShowVersusStartOptions] = useState(false)
  const [versusSetupError, setVersusSetupError] = useState<string | null>(null)

  return {
    versusCategoryFilters,
    setVersusCategoryFilters,
    versusStealRule,
    setVersusStealRule,
    versusTimerOption,
    setVersusTimerOption,
    versusDisableDraws,
    setVersusDisableDraws,
    versusObjectionRule,
    setVersusObjectionRule,
    showVersusSetup,
    setShowVersusSetup,
    showVersusStartOptions,
    setShowVersusStartOptions,
    versusSetupError,
    setVersusSetupError,
  }
}
