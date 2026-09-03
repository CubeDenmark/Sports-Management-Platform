'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { eventMembers, eventSports, events, matchParticipants, matchScorers, matches, teams, users } from '@/lib/db/schema'
import { requireEventAdmin, requireUser } from '@/lib/authorization'
import { hasCourtConflict } from '@/lib/db/repositories/matches'

const matchSchema = z.object({ eventSportId: z.string().uuid(), homeTeamId: z.string().uuid(), awayTeamId: z.string().uuid(), courtId: z.string().uuid().optional(), scheduledStart: z.coerce.date().optional(), stage: z.string().trim().max(120).optional() })

export async function createMatch(eventId: string, input: unknown) {
  await requireEventAdmin(eventId)
  const data = matchSchema.parse(input)
  if (data.homeTeamId === data.awayTeamId) throw new Error('Select two different teams')
  const sports = await db.select({ id: eventSports.sportId }).from(eventSports).where(and(eq(eventSports.eventId, eventId), eq(eventSports.sportId, data.eventSportId))).limit(1)
  const validTeams = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.eventId, eventId)))
  if (!sports.length || !validTeams.some((team) => team.id === data.homeTeamId) || !validTeams.some((team) => team.id === data.awayTeamId)) throw new Error('Invalid event selection')
  if (data.courtId && data.scheduledStart && await hasCourtConflict(eventId, data.courtId, data.scheduledStart)) throw new Error('That court is already scheduled at this time')
  const [match] = await db.insert(matches).values({ eventId, eventSportId: data.eventSportId, courtId: data.courtId, scheduledStart: data.scheduledStart, status: 'READY' }).returning()
  await db.insert(matchParticipants).values([{ matchId: match.id, participantKey: 'HOME', teamId: data.homeTeamId }, { matchId: match.id, participantKey: 'AWAY', teamId: data.awayTeamId }])
  revalidatePath(`/events/${eventId}`)
  return match.id
}

export async function assignScorer(eventId: string, matchId: string, userId: string) {
  const admin = await requireEventAdmin(eventId)
  const [match] = await db.select({ id: matches.id }).from(matches).where(and(eq(matches.id, matchId), eq(matches.eventId, eventId))).limit(1)
  const [scorer] = await db.select({ id: users.id }).from(users).innerJoin(eventMembers, eq(eventMembers.userId, users.id)).where(and(eq(users.id, userId), eq(eventMembers.eventId, eventId), eq(eventMembers.role, 'SCORER'))).limit(1)
  if (!match || !scorer) throw new Error('Match or eligible scorer not found')
  await db.insert(matchScorers).values({ matchId, userId, assignedBy: admin.id, status: 'ACTIVE' }).onConflictDoUpdate({ target: [matchScorers.matchId, matchScorers.userId], set: { status: 'ACTIVE', assignedBy: admin.id } })
  revalidatePath(`/events/${eventId}/matches/${matchId}`)
}

export async function updateMatchSchedule(eventId: string, matchId: string, input: unknown) {
  await requireEventAdmin(eventId)
  const data = z.object({ courtId: z.string().uuid().optional(), scheduledStart: z.coerce.date().optional(), status: z.enum(['READY', 'LIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']) }).parse(input)
  if (data.courtId && data.scheduledStart && await hasCourtConflict(eventId, data.courtId, data.scheduledStart, matchId)) throw new Error('That court is already scheduled at this time')
  const [updated] = await db.update(matches).set({ courtId: data.courtId, scheduledStart: data.scheduledStart, status: data.status, updatedAt: new Date() }).where(and(eq(matches.id, matchId), eq(matches.eventId, eventId))).returning()
  if (!updated) throw new Error('Match not found')
  revalidatePath(`/events/${eventId}/matches`)
  revalidatePath(`/events/${eventId}/matches/${matchId}`)
}

export async function listAssignedMatches() {
  const user = await requireUser()
  return db.select({ match: matches, eventName: events.name }).from(matchScorers).innerJoin(matches, eq(matches.id, matchScorers.matchId)).innerJoin(events, eq(events.id, matches.eventId)).where(and(eq(matchScorers.userId, user.id), eq(matchScorers.status, 'ACTIVE')))
}
