import { addPoints, baseValidate, type ScoringEngine } from './scoring-engine'

function validatePeriods(command: Parameters<ScoringEngine['validate']>[0], maxPeriods: number, allowed: number[]) {
  baseValidate(command, allowed)
  if (command.period > maxPeriods) throw new Error(`Invalid ${command.sport} period`)
}

export const basketballEngine: ScoringEngine = {
  sport: 'basketball', periodLabel: 'Quarter', canUndo: () => true,
  validate: (command) => validatePeriods(command, 4, [1, 2, 3]),
  apply: addPoints,
}

export const volleyballEngine: ScoringEngine = {
  sport: 'volleyball', periodLabel: 'Set', canUndo: () => true,
  validate: (command) => validatePeriods(command, 5, [1]),
  apply: addPoints,
}

export const badmintonEngine: ScoringEngine = {
  sport: 'badminton', periodLabel: 'Game', canUndo: () => true,
  validate: (command) => validatePeriods(command, 3, [1]),
  apply: addPoints,
}

export const scoringEngines = { basketball: basketballEngine, volleyball: volleyballEngine, badminton: badmintonEngine } as const
export function getScoringEngine(sport: string): ScoringEngine { return scoringEngines[sport as keyof typeof scoringEngines] ?? basketballEngine }
