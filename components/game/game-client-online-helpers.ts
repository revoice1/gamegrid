export type GameClientMode = 'daily' | 'practice' | 'versus'

interface OnlineVersusForegroundOptions {
  mode: GameClientMode
  showOnlineLobby: boolean
  isResumingOnlineVersus: boolean
}

interface RestorableVersusStateOptions {
  hasSavedVersusPuzzle: boolean
  hasOnlineRoom: boolean
}

export function shouldForegroundOnlineVersusSession(
  options: OnlineVersusForegroundOptions
): boolean {
  return options.mode === 'versus' || options.showOnlineLobby || options.isResumingOnlineVersus
}

export function hasRestorableVersusState(options: RestorableVersusStateOptions): boolean {
  return options.hasSavedVersusPuzzle || options.hasOnlineRoom
}
