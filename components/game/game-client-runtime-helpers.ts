import type { Category } from '@/lib/types'
import type { VersusCategoryFilters } from './versus-setup-modal'

export type AnimationQuality = 'high' | 'medium' | 'low'

export interface VersusRecord {
  xWins: number
  oWins: number
}

export const VERSUS_RECORD_KEY = 'gamegrid_versus_record'

export function detectAnimationQuality(): AnimationQuality {
  if (typeof window === 'undefined') {
    return 'high'
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  if (prefersReducedMotion) {
    return 'low'
  }

  const navigatorWithHints = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
  }
  const deviceMemory = navigatorWithHints.deviceMemory ?? 8
  const hardwareConcurrency = navigatorWithHints.hardwareConcurrency ?? 8

  if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
    return 'low'
  }

  if (deviceMemory <= 8 || hardwareConcurrency <= 8) {
    return 'medium'
  }

  return 'high'
}

export function playFinalStealHeartbeatCue() {
  if (typeof window === 'undefined') {
    return
  }

  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  try {
    const context = new AudioContextCtor()
    const startTime = context.currentTime + 0.02
    const pulseOffsets = [0, 0.18]
    const baseFrequencies = [58, 50]

    void context.resume().catch(() => undefined)

    const masterGain = context.createGain()
    masterGain.gain.setValueAtTime(0.06, startTime)
    masterGain.connect(context.destination)

    pulseOffsets.forEach((offset, index) => {
      const pulseStart = startTime + offset
      const pulseEnd = pulseStart + 0.11
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(baseFrequencies[index] ?? 52, pulseStart)
      oscillator.frequency.exponentialRampToValueAtTime(
        (baseFrequencies[index] ?? 52) * 0.78,
        pulseEnd
      )

      gainNode.gain.setValueAtTime(0.0001, pulseStart)
      gainNode.gain.exponentialRampToValueAtTime(index === 0 ? 0.12 : 0.09, pulseStart + 0.016)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, pulseEnd)

      oscillator.connect(gainNode)
      gainNode.connect(masterGain)
      oscillator.start(pulseStart)
      oscillator.stop(pulseEnd + 0.02)
    })

    window.setTimeout(() => {
      void context.close().catch(() => undefined)
    }, 900)
  } catch {
    // Audio is optional here; silently skip if the environment blocks it.
  }
}

export function hasNonEmptyFilters(filters: VersusCategoryFilters): boolean {
  return Object.values(filters).some((values) => Array.isArray(values) && values.length > 0)
}

export function getInitialVersusRecord(): VersusRecord {
  if (typeof window === 'undefined') {
    return { xWins: 0, oWins: 0 }
  }

  try {
    const raw = sessionStorage.getItem(VERSUS_RECORD_KEY)
    if (!raw) {
      return { xWins: 0, oWins: 0 }
    }

    const parsed = JSON.parse(raw) as Partial<VersusRecord>
    return {
      xWins: parsed.xWins ?? 0,
      oWins: parsed.oWins ?? 0,
    }
  } catch {
    return { xWins: 0, oWins: 0 }
  }
}

export function saveVersusRecord(record: VersusRecord) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.setItem(VERSUS_RECORD_KEY, JSON.stringify(record))
  } catch {
    // Ignore storage failures and keep the in-memory record.
  }
}

export function buildMissReason(
  rowCategory: Category,
  colCategory: Category,
  matchesRow?: boolean,
  matchesCol?: boolean
): string {
  const failures: string[] = []

  if (matchesRow === false) {
    failures.push(`didn't match ${rowCategory.name}`)
  }

  if (matchesCol === false) {
    failures.push(`didn't match ${colCategory.name}`)
  }

  if (failures.length === 0) {
    return `didn't match ${rowCategory.name} x ${colCategory.name}`
  }

  if (failures.length === 1) {
    return failures[0]
  }

  return `${failures[0]} or ${failures[1]}`
}
