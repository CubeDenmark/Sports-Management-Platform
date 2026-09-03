'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/authorization'
import { db } from '@/lib/db'
import { matchScorers, matchStates, matches, scoreEvents } from '@/lib/db/schema'
import { getScoringState } from '@/lib/services/basketball-scoring'

const scoreInput = z.object({ matchId: z.string().uuid(), participantKey: z.enum(['HOME', 'AWAY']), points: z.union([z.literal(1), z.literal(2), z.literal(3)]), period: z.number().int().min(1).max(4), clientEventId: z.string().min(8).max(120) })

async function requireAssigned(matchId: string) {
  const user = await requireUser()
  const rows = await db.select({ matchId: matchScorers.matchId }).from(matchScorers).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, user.id), eq(matchScorers.status, 'ACTIVE'))).limit(1)
  if (!rows.length) throw new Error('You are not assigned to this match')
  return user
}

export async function getBasketballState(matchId: string) {
  const user = await requireAssigned(matchId)
  return getScoringState(matchId, user.id)
}

export async function postBasketballScore(input: unknown) {
  const data = scoreInput.parse(input)
  const user = await requireAssigned(data.matchId)
  const [match] = await db.select({ eventId: matches.eventId }).from(matches).where(eq(matches.id, data.matchId)).limit(1)
  if (!match) throw new Error('Match not found')
  await db.transaction(async (tx) => {
    const [state] = await tx.select().from(matchStates).where(eq(matchStates.matchId, data.matchId)).limit(1)
    if (state?.matchStatus === 'COMPLETED' || state?.matchStatus === 'CANCELLED') throw new Error('Match is not active')
    const sequence = await tx.$count(scoreEvents, eq(scoreEvents.matchId, data.matchId))
    await tx.insert(scoreEvents).values({ matchId: data.matchId, clientEventId: data.clientEventId, participantKey: data.participantKey, eventType: `BASKETBALL_${data.points}`, points: data.points, period: data.period, sequenceNumber: sequence + 1, createdBy: user.id }) .onConflictDoNothing({ target: [scoreEvents.matchId, scoreEvents.clientEventId] })
    const events = await tx.select({ participantKey: scoreEvents.participantKey, points: scoreEvents.points }).from(scoreEvents).where(and(eq(scoreEvents.matchId, data.matchId), eq(scoreEvents.status, 'POSTED')))
    const home = events.filter((event) => event.participantKey === 'HOME').reduce((sum, event) => sum + event.points, 0)
    const away = events.filter((event) => event.participantKey === 'AWAY').reduce((sum, event) => sum + event.points, 0)
    await tx.insert(matchStates).values({ matchId: data.matchId, homeScore: home, awayScore: away, currentPeriod: data.period, matchStatus: 'LIVE', version: 1 }).onConflictDoUpdate({ target: matchStates.matchId, set: { homeScore: home, awayScore: away, currentPeriod: data.period, matchStatus: 'LIVE', version: sql`${matchStates.version} + 1`, updatedAt: new Date() } })
    await tx.update(matches).set({ status: 'LIVE', updatedAt: new Date() }).where(eq(matches.id, data.matchId))
  })
  revalidatePath(`/events/${match.eventId}/matches/${data.matchId}`)
  revalidatePath('/scorer')
}

export async function setBasketballStatus(matchId: string, status: 'LIVE' | 'PAUSED' | 'COMPLETED') {
  await requireAssigned(matchId)
  await db.update(matchStates).set({ matchStatus: status, updatedAt: new Date(), version: sql`${matchStates.version} + 1` }).where(eq(matchStates.matchId, matchId))
  await db.update(matches).set({ status, updatedAt: new Date() }).where(eq(matches.id, matchId))
  revalidatePath(`/events/${matchId}`)
}

export async function undoLastBasketballScore(matchId: string) {
  const user = await requireAssigned(matchId)
  const [last] = await db.select({ id: scoreEvents.id }).from(scoreEvents).where(and(eq(scoreEvents.matchId, matchId), eq(scoreEvents.status, 'POSTED'))).orderBy(desc(scoreEvents.sequenceNumber)).limit(1)
  if (!last) return
  await db.update(scoreEvents).set({ status: 'UNDONE', undoneAt: new Date(), updatedAt: new Date() }).where(eq(scoreEvents.id, last.id))
  const state = await getScoringState(matchId, user.id)
  const home = state.events.filter((event) => event.participantKey === 'HOME' && event.status === 'POSTED').reduce((sum, event) => sum + event.points, 0)
  const away = state.events.filter((event) => event.participantKey === 'AWAY' && event.status === 'POSTED').reduce((sum, event) => sum + event.points, 0)
  await db.update(matchStates).set({ homeScore: home, awayScore: away, version: sql`${matchStates.version} + 1`, updatedAt: new Date() }).where(eq(matchStates.matchId, matchId))
}
