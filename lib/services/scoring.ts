import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matchParticipants, matchScorers, matchStates, matches, scoreEvents } from '@/lib/db/schema'
import { realtimePublisher } from '@/lib/realtime/publisher'

export type ScoreAction = { matchId: string; userId: string; clientEventId: string; participantKey: 'HOME' | 'AWAY'; points: 1 | 2 | 3; period: 1 | 2 | 3 | 4 }

export async function canScoreMatch(matchId: string, userId: string) {
  const rows = await db.select({ matchId: matchScorers.matchId }).from(matchScorers).innerJoin(matches, eq(matches.id, matchScorers.matchId)).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, userId), eq(matchScorers.status, 'ACTIVE'))).limit(1)
  return rows.length > 0
}

export async function appendScoreAction(input: ScoreAction) {
  const state = await db.transaction(async (tx) => {
    const assignment = await tx.select({ matchId: matchScorers.matchId }).from(matchScorers).where(and(eq(matchScorers.matchId, input.matchId), eq(matchScorers.userId, input.userId), eq(matchScorers.status, 'ACTIVE'))).limit(1)
    if (!assignment.length) throw new Error('Unauthorized')
    const [match] = await tx.select({ id: matches.id }).from(matches).where(eq(matches.id, input.matchId)).for('update')
    if (!match) throw new Error('Match not found')
    const [existing] = await tx.select().from(scoreEvents).where(and(eq(scoreEvents.matchId, input.matchId), eq(scoreEvents.clientEventId, input.clientEventId))).limit(1)
    if (existing) return getStateForTransaction(tx, input.matchId)
    const [state] = await tx.select().from(matchStates).where(eq(matchStates.matchId, input.matchId)).for('update')
    if (state?.matchStatus === 'COMPLETED' || state?.matchStatus === 'CANCELLED') throw new Error('Match is not active')
    const [last] = await tx.select({ sequenceNumber: scoreEvents.sequenceNumber }).from(scoreEvents).where(eq(scoreEvents.matchId, input.matchId)).orderBy(desc(scoreEvents.sequenceNumber)).limit(1)
    await tx.insert(scoreEvents).values({ matchId: input.matchId, clientEventId: input.clientEventId, participantKey: input.participantKey, eventType: `BASKETBALL_${input.points}`, points: input.points, period: input.period, sequenceNumber: (last?.sequenceNumber ?? 0) + 1, createdBy: input.userId })
    return updateProjection(tx, input.matchId, input.period, 'LIVE')
  })
  await realtimePublisher.publish({ type: 'score.created', matchId: input.matchId, version: state?.version })
  return state
}

export async function undoScoreAction(matchId: string, userId: string) {
  return db.transaction(async (tx) => {
    const assignment = await tx.select({ matchId: matchScorers.matchId }).from(matchScorers).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, userId), eq(matchScorers.status, 'ACTIVE'))).limit(1)
    if (!assignment.length) throw new Error('Unauthorized')
    const [match] = await tx.select({ id: matches.id }).from(matches).where(eq(matches.id, matchId)).for('update')
    if (!match) throw new Error('Match not found')
    const [last] = await tx.select({ id: scoreEvents.id }).from(scoreEvents).where(and(eq(scoreEvents.matchId, matchId), eq(scoreEvents.status, 'POSTED'))).orderBy(desc(scoreEvents.sequenceNumber)).limit(1)
    if (!last) return getStateForTransaction(tx, matchId)
    await tx.update(scoreEvents).set({ status: 'UNDONE', undoneAt: new Date(), updatedAt: new Date() }).where(eq(scoreEvents.id, last.id))
    return updateProjection(tx, matchId)
  })
}

async function updateProjection(tx: any, matchId: string, period?: number, status: 'LIVE' | 'PAUSED' | 'COMPLETED' | 'READY' = 'LIVE') {
  const events = await tx.select({ participantKey: scoreEvents.participantKey, points: scoreEvents.points, period: scoreEvents.period, status: scoreEvents.status }).from(scoreEvents).where(eq(scoreEvents.matchId, matchId)).orderBy(asc(scoreEvents.sequenceNumber))
  const homeScore = events.filter((e: any) => e.participantKey === 'HOME' && e.status === 'POSTED').reduce((sum: number, e: any) => sum + e.points, 0)
  const awayScore = events.filter((e: any) => e.participantKey === 'AWAY' && e.status === 'POSTED').reduce((sum: number, e: any) => sum + e.points, 0)
  const periodState = events.reduce((all: Record<string, Record<string, number>>, e: any) => { if (e.status === 'POSTED' && e.period) { all[e.period] ??= { HOME: 0, AWAY: 0 }; all[e.period][e.participantKey] += e.points } return all }, {})
  const [state] = await tx.insert(matchStates).values({ matchId, homeScore, awayScore, currentPeriod: period ?? 1, periodState, matchStatus: status, version: 1 }).onConflictDoUpdate({ target: matchStates.matchId, set: { homeScore, awayScore, ...(period === undefined ? {} : { currentPeriod: period }), periodState, matchStatus: status, version: sql`${matchStates.version} + 1`, updatedAt: new Date() } }).returning()
  return state
}

async function getStateForTransaction(tx: any, matchId: string) { const [state] = await tx.select().from(matchStates).where(eq(matchStates.matchId, matchId)).limit(1); return state }

export async function listScoreEvents(matchId: string, userId: string) { if (!(await canScoreMatch(matchId, userId))) throw new Error('Unauthorized'); return db.select().from(scoreEvents).where(eq(scoreEvents.matchId, matchId)).orderBy(desc(scoreEvents.sequenceNumber)) }
export async function getScoringState(matchId: string, userId: string) { if (!(await canScoreMatch(matchId, userId))) throw new Error('Unauthorized'); const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1); const [state] = await db.select().from(matchStates).where(eq(matchStates.matchId, matchId)).limit(1); const events = await db.select().from(scoreEvents).where(eq(scoreEvents.matchId, matchId)).orderBy(desc(scoreEvents.sequenceNumber)); const participants = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId)); return { match, state, events, participants } }
