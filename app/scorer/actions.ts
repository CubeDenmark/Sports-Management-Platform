'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/authorization'
import { db } from '@/lib/db'
import { courts, eventMembers, eventSports, events, matchParticipants, matchScorers, matches, matchStates, sports, teams, users } from '@/lib/db/schema'
import { appendScoreAction, getScoringState, undoScoreAction } from '@/lib/services/scoring'

const scoreInput = z.object({ matchId: z.string().uuid(), participantKey: z.enum(['HOME', 'AWAY']), points: z.number().int().min(1).max(3), period: z.number().int().min(1).max(9), clientEventId: z.string().min(8).max(120), sport: z.enum(['basketball', 'volleyball', 'badminton']).default('basketball') })

export async function listAssignedMatches() {
  const user = await requireUser()
  return db.select({ match: matches, eventName: events.name, sport: sports.name, court: courts.name, homeTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'HOME' then ${teams.name} end)`, awayTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'AWAY' then ${teams.name} end)` }).from(matchScorers).innerJoin(matches, eq(matches.id, matchScorers.matchId)).innerJoin(events, eq(events.id, matches.eventId)).innerJoin(eventMembers, and(eq(eventMembers.eventId, matches.eventId), eq(eventMembers.userId, user.id), eq(eventMembers.role, 'SCORER'))).innerJoin(users, and(eq(users.id, user.id), eq(users.role, 'SCORER'), eq(users.isActive, true))).innerJoin(eventSports, and(eq(eventSports.eventId, matches.eventId), eq(eventSports.sportId, matches.eventSportId))).innerJoin(sports, eq(sports.id, eventSports.sportId)).leftJoin(courts, eq(courts.id, matches.courtId)).leftJoin(matchParticipants, eq(matchParticipants.matchId, matches.id)).leftJoin(teams, eq(teams.id, matchParticipants.teamId)).where(and(eq(matchScorers.userId, user.id), eq(matchScorers.status, 'ACTIVE'))).groupBy(matches.id, events.name, sports.name, courts.name).orderBy(matches.scheduledStart)
}

async function requireAssigned(matchId: string) {
  const user = await requireUser()
  const rows = await db.select({ matchId: matchScorers.matchId }).from(matchScorers).innerJoin(users, eq(users.id, matchScorers.userId)).where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, user.id), eq(matchScorers.status, 'ACTIVE'), eq(users.role, 'SCORER'), eq(users.isActive, true))).limit(1)
  if (!rows.length) throw new Error('You are not assigned to this match')
  return user
}

export async function getBasketballState(matchId: string) { const user = await requireAssigned(matchId); return getScoringState(matchId, user.id) }

export async function postSportScore(input: unknown) {
  const data = scoreInput.parse(input)
  const user = await requireAssigned(data.matchId)
  const [match] = await db.select({ eventId: matches.eventId, eventSportId: matches.eventSportId }).from(matches).where(eq(matches.id, data.matchId)).limit(1)
  if (!match) throw new Error('Match not found')
  const [sport] = await db.select({ slug: sports.slug }).from(eventSports).innerJoin(sports, eq(sports.id, eventSports.sportId)).where(and(eq(eventSports.eventId, match.eventId), eq(eventSports.sportId, match.eventSportId))).limit(1)
  if (!sport) throw new Error('Match sport is not configured')
  await appendScoreAction({ matchId: data.matchId, userId: user.id, clientEventId: data.clientEventId, participantKey: data.participantKey, points: data.points, period: data.period, sport: sport.slug })
  revalidatePath(`/events/${match.eventId}/matches/${data.matchId}`); revalidatePath(`/scorer/${data.matchId}`)
}

export async function postBasketballScore(input: unknown) { return postSportScore({ ...(input as Record<string, unknown>), sport: 'basketball' }) }

export async function setBasketballStatus(matchId: string, status: 'LIVE' | 'PAUSED' | 'COMPLETED') {
  const user = await requireAssigned(matchId)
  await db.transaction(async (tx) => {
    await tx.select({ matchId: matchStates.matchId }).from(matchStates).where(eq(matchStates.matchId, matchId)).for('update')
    const now = new Date()
    await tx.insert(matchStates).values({ matchId, matchStatus: status, version: 1, updatedAt: now }).onConflictDoUpdate({ target: matchStates.matchId, set: { matchStatus: status, version: sql`${matchStates.version} + 1`, updatedAt: now } })
    await tx.update(matches).set({ status, actualStart: status === 'LIVE' ? now : undefined, actualEnd: status === 'COMPLETED' ? now : undefined, updatedAt: now }).where(eq(matches.id, matchId))
  })
  void user
  revalidatePath(`/scorer/${matchId}`)
}

export async function undoLastBasketballScore(matchId: string) {
  const user = await requireAssigned(matchId)
  await undoScoreAction(matchId, user.id)
  revalidatePath(`/scorer/${matchId}`)
}
