import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matchParticipants, matchScorers, matchStates, matches, scoreEvents } from '@/lib/db/schema'

export const BASKETBALL_PERIODS = [1, 2, 3, 4] as const
export const BASKETBALL_POINTS = [1, 2, 3] as const

export async function getScoringState(matchId: string, userId: string) {
  const assignment = await db.select({ matchId: matchScorers.matchId }).from(matchScorers).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, userId), eq(matchScorers.status, 'ACTIVE'))).limit(1)
  if (!assignment.length) throw new Error('Unauthorized')
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
  const [state] = await db.select().from(matchStates).where(eq(matchStates.matchId, matchId)).limit(1)
  const events = await db.select().from(scoreEvents).where(eq(scoreEvents.matchId, matchId)).orderBy(desc(scoreEvents.sequenceNumber))
  const participants = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId))
  return { match, state, events, participants }
}

export function calculateScore(events: Array<{ participantKey: string; points: number; status: 'POSTED' | 'UNDONE' }>) {
  return events.reduce((score, event) => event.status === 'POSTED' ? { ...score, [event.participantKey]: (score[event.participantKey] ?? 0) + event.points } : score, {} as Record<string, number>)
}
