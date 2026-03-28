import type { Category } from '@/lib/types'
import type { VersusCategoryFilters } from './versus-setup-modal'

export type AnimationQuality = 'high' | 'medium' | 'low'

export interface VersusRecord {
  xWins: number
  oWins: number
}

export const VERSUS_RECORD_KEY = 'gamegrid_versus_record'

let sharedVersusAudioContext: AudioContext | null = null
let audioUnlockListenersAttached = false
let finalStealHeartbeatLoopTimer: number | null = null

function getAudioContextCtor() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

function getSharedVersusAudioContext(): AudioContext | null {
  const AudioContextCtor = getAudioContextCtor()
  if (!AudioContextCtor) {
    return null
  }

  if (!sharedVersusAudioContext || sharedVersusAudioContext.state === 'closed') {
    sharedVersusAudioContext = new AudioContextCtor()
  }

  return sharedVersusAudioContext
}

function attachAudioUnlockListeners(context: AudioContext) {
  if (typeof window === 'undefined' || audioUnlockListenersAttached) {
    return
  }

  const unlock = () => {
    void context.resume().catch(() => undefined)
    if (context.state === 'running') {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
      audioUnlockListenersAttached = false
    }
  }

  audioUnlockListenersAttached = true
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
  window.addEventListener('touchstart', unlock, { passive: true })
}

export function primeVersusAudioContext() {
  const context = getSharedVersusAudioContext()
  if (!context) {
    return
  }

  if (context.state === 'running') {
    return
  }

  attachAudioUnlockListeners(context)
}

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
  const context = getSharedVersusAudioContext()
  if (!context) {
    return
  }

  try {
    attachAudioUnlockListeners(context)
    const startTime = context.currentTime + 0.02
    const pulseOffsets = [0, 0.18]
    const baseFrequencies = [68, 58]

    void context.resume().catch(() => undefined)

    const compressor = context.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-24, startTime)
    compressor.knee.setValueAtTime(18, startTime)
    compressor.ratio.setValueAtTime(12, startTime)
    compressor.attack.setValueAtTime(0.003, startTime)
    compressor.release.setValueAtTime(0.18, startTime)

    const masterGain = context.createGain()
    masterGain.gain.setValueAtTime(0.85, startTime)
    masterGain.connect(compressor)
    compressor.connect(context.destination)

    pulseOffsets.forEach((offset, index) => {
      const pulseStart = startTime + offset
      const pulseEnd = pulseStart + 0.2
      const oscillator = context.createOscillator()
      const harmonicOscillator = context.createOscillator()
      const clickOscillator = context.createOscillator()
      const gainNode = context.createGain()
      const filter = context.createBiquadFilter()
      const clickGain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(baseFrequencies[index] ?? 52, pulseStart)
      oscillator.frequency.exponentialRampToValueAtTime(
        (baseFrequencies[index] ?? 52) * 0.68,
        pulseEnd
      )

      harmonicOscillator.type = 'triangle'
      harmonicOscillator.frequency.setValueAtTime((baseFrequencies[index] ?? 52) * 1.35, pulseStart)
      harmonicOscillator.frequency.exponentialRampToValueAtTime(
        (baseFrequencies[index] ?? 52) * 1.08,
        pulseEnd
      )

      clickOscillator.type = 'triangle'
      clickOscillator.frequency.setValueAtTime(118, pulseStart)
      clickOscillator.frequency.exponentialRampToValueAtTime(82, pulseStart + 0.05)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(210, pulseStart)
      filter.frequency.exponentialRampToValueAtTime(145, pulseEnd)
      filter.Q.setValueAtTime(0.7, pulseStart)

      gainNode.gain.setValueAtTime(0.0001, pulseStart)
      gainNode.gain.exponentialRampToValueAtTime(index === 0 ? 1.1 : 0.82, pulseStart + 0.022)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, pulseEnd)

      clickGain.gain.setValueAtTime(0.0001, pulseStart)
      clickGain.gain.exponentialRampToValueAtTime(index === 0 ? 0.1 : 0.08, pulseStart + 0.01)
      clickGain.gain.exponentialRampToValueAtTime(0.0001, pulseStart + 0.07)

      oscillator.connect(filter)
      harmonicOscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(masterGain)
      clickOscillator.connect(clickGain)
      clickGain.connect(masterGain)
      oscillator.start(pulseStart)
      harmonicOscillator.start(pulseStart)
      clickOscillator.start(pulseStart)
      oscillator.stop(pulseEnd + 0.02)
      harmonicOscillator.stop(pulseEnd + 0.02)
      clickOscillator.stop(pulseStart + 0.06)
    })
  } catch {
    // Audio is optional here; silently skip if the environment blocks it.
  }
}

export function startFinalStealHeartbeatLoop() {
  stopFinalStealHeartbeatLoop()
  playFinalStealHeartbeatCue()

  if (typeof window === 'undefined') {
    return
  }

  finalStealHeartbeatLoopTimer = window.setInterval(() => {
    playFinalStealHeartbeatCue()
  }, 1500)
}

export function stopFinalStealHeartbeatLoop() {
  if (typeof window === 'undefined') {
    return
  }

  if (finalStealHeartbeatLoopTimer !== null) {
    window.clearInterval(finalStealHeartbeatLoopTimer)
    finalStealHeartbeatLoopTimer = null
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
