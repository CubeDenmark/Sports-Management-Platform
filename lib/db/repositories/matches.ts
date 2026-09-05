import { and, asc, eq, inArray, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courts, eventSports, matchParticipants, matchScorers, matches, sports, teams, users } from '@/lib/db/schema'

export async function listMatches(eventId: string) {
  return db.select({ match: matches, sport: sports.name, court: courts.name, homeTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'HOME' then ${teams.name} end)`, awayTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'AWAY' then ${teams.name} end)`, scorer: sql<string | null>`max(${users.displayName})` }).from(matches).innerJoin(eventSports, and(eq(eventSports.eventId, matches.eventId), eq(eventSports.sportId, matches.eventSportId))).innerJoin(sports, eq(sports.id, eventSports.sportId)).leftJoin(courts, eq(courts.id, matches.courtId)).leftJoin(matchParticipants, eq(matchParticipants.matchId, matches.id)).leftJoin(teams, eq(teams.id, matchParticipants.teamId)).leftJoin(matchScorers, and(eq(matchScorers.matchId, matches.id), eq(matchScorers.status, 'ACTIVE'))).leftJoin(users, eq(users.id, matchScorers.userId)).where(eq(matches.eventId, eventId)).groupBy(matches.id, sports.name, courts.name).orderBy(asc(matches.scheduledStart))
}

export async function getMatch(matchId: string, eventId?: string) {
  const rows = await db.select({ match: matches, sport: sports.name, court: courts.name, participantKey: matchParticipants.participantKey, teamId: matchParticipants.teamId, teamName: teams.name, scorerId: matchScorers.userId, scorerName: users.displayName }).from(matches).innerJoin(eventSports, and(eq(eventSports.eventId, matches.eventId), eq(eventSports.sportId, matches.eventSportId))).innerJoin(sports, eq(sports.id, eventSports.sportId)).leftJoin(courts, eq(courts.id, matches.courtId)).leftJoin(matchParticipants, eq(matchParticipants.matchId, matches.id)).leftJoin(teams, eq(teams.id, matchParticipants.teamId)).leftJoin(matchScorers, and(eq(matchScorers.matchId, matches.id), eq(matchScorers.status, 'ACTIVE'))).leftJoin(users, eq(users.id, matchScorers.userId)).where(eventId ? and(eq(matches.id, matchId), eq(matches.eventId, eventId)) : eq(matches.id, matchId))
  return rows
}

export async function hasCourtConflict(eventId: string, courtId: string, scheduledStart: Date, excludeId?: string) {
  const rows = await db.select({ id: matches.id }).from(matches).where(and(eq(matches.eventId, eventId), eq(matches.courtId, courtId), eq(matches.scheduledStart, scheduledStart), ne(matches.status, 'CANCELLED'), excludeId ? ne(matches.id, excludeId) : sql`true`)).limit(1)
  return Boolean(rows.length)
}

export { db, courts, eventSports, matchParticipants, matchScorers, matches, sports, teams, users, inArray }
