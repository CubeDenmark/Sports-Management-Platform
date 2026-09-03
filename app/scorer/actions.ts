'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/authorization'
import { db } from '@/lib/db'
import { matchScorers, matches, matchStates } from '@/lib/db/schema'
import { appendScoreAction, getScoringState, undoScoreAction } from '@/lib/services/scoring'

const scoreInput = z.object({ matchId: z.string().uuid(), participantKey: z.enum(['HOME', 'AWAY']), points: z.number().int().min(1).max(3), period: z.number().int().min(1).max(9), clientEventId: z.string().min(8).max(120), sport: z.enum(['basketball', 'volleyball', 'badminton']).default('basketball') })

async function requireAssigned(matchId: string) {
  const user = await requireUser()
  const rows = await db.select({ matchId: matchScorers.matchId }).from(matchScorers).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, user.id), eq(matchScorers.status, 'ACTIVE'))).limit(1)
  if (!rows.length) throw new Error('You are not assigned to this match')
  return user
}

export async function getBasketballState(matchId: string) { const user = await requireAssigned(matchId); return getScoringState(matchId, user.id) }

export async function postSportScore(input: unknown) {
  const data = scoreInput.parse(input)
  const user = await requireAssigned(data.matchId)
  const [match] = await db.select({ eventId: matches.eventId }).from(matches).where(eq(matches.id, data.matchId)).limit(1)
  if (!match) throw new Error('Match not found')
  await appendScoreAction({ matchId: data.matchId, userId: user.id, clientEventId: data.clientEventId, participantKey: data.participantKey, points: data.points, period: data.period, sport: data.sport })
  revalidatePath(`/events/${match.eventId}/matches/${data.matchId}`); revalidatePath(`/scorer/${data.matchId}`)
}

export async function postBasketballScore(input: unknown) { return postSportScore({ ...(input as Record<string, unknown>), sport: 'basketball' }) }

export async function setBasketballStatus(matchId: string, status: 'LIVE' | 'PAUSED' | 'COMPLETED') {
  const user = await requireAssigned(matchId)
  await db.transaction(async (tx) => {
    const [state] = await tx.select().from(matchStates).where(eq(matchStates.matchId, matchId)).for('update')
    await tx.update(matchStates).set({ matchStatus: status, version: (state?.version ?? 0) + 1, updatedAt: new Date() }).where(eq(matchStates.matchId, matchId))
    await tx.update(matches).set({ status, updatedAt: new Date() }).where(eq(matches.id, matchId))
  })
  void user
  revalidatePath(`/scorer/${matchId}`)
}

export async function undoLastBasketballScore(matchId: string) {
  const user = await requireAssigned(matchId)
  await undoScoreAction(matchId, user.id)
  revalidatePath(`/scorer/${matchId}`)
}
