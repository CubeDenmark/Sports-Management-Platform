export type Sport = 'basketball' | 'volleyball' | 'badminton'
export type PlayerPerformance = { playerId: string; playerName: string; points: number; assists?: number; rebounds?: number; blocks?: number; aces?: number; wins?: number; errors?: number }

/** Deterministic, explainable MVP ranking. Persist the selected player in the result summary after organizer approval. */
export function rankMvpCandidates(sport: Sport, players: PlayerPerformance[]) {
  return [...players].sort((a, b) => scoreMvp(sport, b) - scoreMvp(sport, a)).map((player, index) => ({ ...player, rank: index + 1, mvpScore: scoreMvp(sport, player) }))
}
export function scoreMvp(sport: Sport, player: PlayerPerformance) {
  if (sport === 'basketball') return player.points + (player.assists ?? 0) * 1.5 + (player.rebounds ?? 0) + (player.blocks ?? 0) * 2 - (player.errors ?? 0)
  if (sport === 'volleyball') return (player.wins ?? 0) * 5 + player.points + (player.aces ?? 0) * 2 - (player.errors ?? 0)
  return (player.wins ?? 0) * 10 + player.points - (player.errors ?? 0)
}
export const mvpCriteria: Record<Sport, string[]> = { basketball: ['Points', 'Assists', 'Rebounds', 'Blocks', 'Turnovers'], volleyball: ['Match-winning sets', 'Points', 'Aces', 'Errors'], badminton: ['Games won', 'Rally points', 'Unforced errors'] }
