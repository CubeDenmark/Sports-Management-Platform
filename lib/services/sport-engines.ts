import { addPoints, baseValidate, type ScoringEngine } from './scoring-engine'

export const basketballEngine: ScoringEngine = {
  sport: 'basketball', periodLabel: 'Quarter', canUndo: () => true,
  validate: (command) => baseValidate(command, [1, 2, 3]),
  apply: addPoints,
}

export const volleyballEngine: ScoringEngine = {
  sport: 'volleyball', periodLabel: 'Set', canUndo: () => true,
  validate: (command) => baseValidate(command, [1]),
  apply: addPoints,
}

export const badmintonEngine: ScoringEngine = {
  sport: 'badminton', periodLabel: 'Game', canUndo: () => true,
  validate: (command) => baseValidate(command, [1]),
  apply: addPoints,
}

export const scoringEngines = { basketball: basketballEngine, volleyball: volleyballEngine, badminton: badmintonEngine } as const
export function getScoringEngine(sport: string): ScoringEngine { return scoringEngines[sport as keyof typeof scoringEngines] ?? basketballEngine }
