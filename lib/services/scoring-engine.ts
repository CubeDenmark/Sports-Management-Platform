export type SportKind = 'basketball' | 'volleyball' | 'badminton'

export type ScoreCommand = {
  sport: SportKind
  period: number
  participantKey: 'HOME' | 'AWAY'
  points: number
}

export type ScoringSnapshot = {
  homeScore: number
  awayScore: number
  period: number
  periodScores: Record<string, { HOME: number; AWAY: number }>
}

export interface ScoringEngine {
  readonly sport: SportKind
  readonly periodLabel: string
  validate(command: ScoreCommand): void
  apply(snapshot: ScoringSnapshot, command: ScoreCommand): ScoringSnapshot
  canUndo(snapshot: ScoringSnapshot): boolean
}

export function cloneSnapshot(snapshot: ScoringSnapshot): ScoringSnapshot {
  return { ...snapshot, periodScores: structuredClone(snapshot.periodScores) }
}

export function addPoints(snapshot: ScoringSnapshot, command: ScoreCommand) {
  const next = cloneSnapshot(snapshot)
  next.homeScore += command.participantKey === 'HOME' ? command.points : 0
  next.awayScore += command.participantKey === 'AWAY' ? command.points : 0
  next.period = command.period
  next.periodScores[String(command.period)] ??= { HOME: 0, AWAY: 0 }
  next.periodScores[String(command.period)][command.participantKey] += command.points
  return next
}

export function baseValidate(command: ScoreCommand, allowed: number[]) {
  if (!Number.isInteger(command.period) || command.period < 1) throw new Error('Invalid period')
  if (!allowed.includes(command.points)) throw new Error('Invalid score value')
}

export function snapshotFromEvents(events: Array<{ participantKey: string; points: number; period: number | null }>): ScoringSnapshot {
  const snapshot: ScoringSnapshot = { homeScore: 0, awayScore: 0, period: 1, periodScores: {} }
  for (const event of events) {
    if ((event.participantKey !== 'HOME' && event.participantKey !== 'AWAY') || event.points < 0) continue
    snapshot.homeScore += event.participantKey === 'HOME' ? event.points : 0
    snapshot.awayScore += event.participantKey === 'AWAY' ? event.points : 0
    if (event.period) { snapshot.period = event.period; snapshot.periodScores[String(event.period)] ??= { HOME: 0, AWAY: 0 }; snapshot.periodScores[String(event.period)][event.participantKey as 'HOME' | 'AWAY'] += event.points }
  }
  return snapshot
}
