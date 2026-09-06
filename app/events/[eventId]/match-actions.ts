'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { courts, eventMembers, eventSports, events, matchParticipants, matchScorers, matches, sports, teams, users } from '@/lib/db/schema'
import { requireEventAdmin, requireUser } from '@/lib/authorization'
import { hasCourtConflict } from '@/lib/db/repositories/matches'

const matchSchema = z.object({ eventSportId: z.string().uuid(), homeTeamId: z.string().uuid(), awayTeamId: z.string().uuid(), courtId: z.string().uuid().optional(), scheduledStart: z.coerce.date(), scheduledEnd: z.coerce.date(), stage: z.string().trim().max(120).optional() }).refine((data) => data.scheduledEnd > data.scheduledStart, { message: 'End time must be after start time' })

export async function createMatch(eventId: string, input: unknown) {
  const admin = await requireEventAdmin(eventId)
  const data = matchSchema.parse(input)
  if (data.homeTeamId === data.awayTeamId) throw new Error('Select two different teams')
  const sports = await db.select({ id: eventSports.sportId }).from(eventSports).where(and(eq(eventSports.eventId, eventId), eq(eventSports.sportId, data.eventSportId))).limit(1)
  const validTeams = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.eventId, eventId)))
  const validCourt = data.courtId ? await db.select({ id: courts.id }).from(courts).where(and(eq(courts.id, data.courtId), eq(courts.eventId, eventId))).limit(1) : [{ id: null }]
  if (!sports.length || !validTeams.some((team) => team.id === data.homeTeamId) || !validTeams.some((team) => team.id === data.awayTeamId) || !validCourt.length) throw new Error('Invalid event selection')
  if (data.courtId && await hasCourtConflict(eventId, data.courtId, data.scheduledStart, data.scheduledEnd)) throw new Error('That court is already scheduled during this time')
  const [match] = await db.insert(matches).values({ eventId, eventSportId: data.eventSportId, courtId: data.courtId, scheduledStart: data.scheduledStart, scheduledEnd: data.scheduledEnd, status: 'READY' }).returning()
  await db.insert(matchParticipants).values([{ matchId: match.id, participantKey: 'HOME', teamId: data.homeTeamId }, { matchId: match.id, participantKey: 'AWAY', teamId: data.awayTeamId }])
  const eventScorers = await db.select({ userId: eventMembers.userId }).from(eventMembers).innerJoin(users, eq(users.id, eventMembers.userId)).where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.role, 'SCORER'), eq(users.role, 'SCORER'), eq(users.isActive, true)))
  if (eventScorers.length) {
    await db.insert(matchScorers).values(eventScorers.map(({ userId }) => ({ matchId: match.id, userId, assignedBy: admin.id, status: 'ACTIVE' as const })))
  }
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/scorer')
  return match.id
}

export async function assignScorer(eventId: string, matchId: string, userId: string) {
  const admin = await requireEventAdmin(eventId)
  const parsedIds = z.object({ eventId: z.string().uuid(), matchId: z.string().uuid(), userId: z.string().uuid() }).parse({ eventId, matchId, userId })
  const [match] = await db.select({ id: matches.id }).from(matches).where(and(eq(matches.id, parsedIds.matchId), eq(matches.eventId, parsedIds.eventId))).limit(1)
  const [scorer] = await db.select({ id: users.id }).from(users).innerJoin(eventMembers, eq(eventMembers.userId, users.id)).where(and(eq(users.id, userId), eq(users.role, 'SCORER'), eq(users.isActive, true), eq(eventMembers.eventId, eventId), eq(eventMembers.role, 'SCORER'))).limit(1)
  if (!match || !scorer) throw new Error('Match or eligible scorer not found')
  await db.insert(matchScorers).values({ matchId, userId, assignedBy: admin.id, status: 'ACTIVE' }).onConflictDoUpdate({ target: [matchScorers.matchId, matchScorers.userId], set: { status: 'ACTIVE', assignedBy: admin.id } })
  revalidatePath(`/events/${eventId}/matches/${matchId}`)
  revalidatePath('/scorer')
}

export async function updateMatchSchedule(eventId: string, matchId: string, input: unknown) {
  await requireEventAdmin(eventId)
  const data = z.object({ courtId: z.string().uuid().optional(), scheduledStart: z.coerce.date(), scheduledEnd: z.coerce.date(), status: z.enum(['READY', 'LIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']) }).refine((value) => value.scheduledEnd > value.scheduledStart, { message: 'End time must be after start time' }).parse(input)
  if (data.courtId && await hasCourtConflict(eventId, data.courtId, data.scheduledStart, data.scheduledEnd, matchId)) throw new Error('That court is already scheduled during this time')
  const [updated] = await db.update(matches).set({ courtId: data.courtId, scheduledStart: data.scheduledStart, scheduledEnd: data.scheduledEnd, status: data.status, updatedAt: new Date() }).where(and(eq(matches.id, matchId), eq(matches.eventId, eventId))).returning()
  if (!updated) throw new Error('Match not found')
  revalidatePath(`/events/${eventId}/matches`)
  revalidatePath(`/events/${eventId}/matches/${matchId}`)
}
