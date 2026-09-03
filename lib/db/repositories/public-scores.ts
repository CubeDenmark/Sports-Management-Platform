import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courts, eventSports, events, matchParticipants, matchScorers, matchStates, matches, scoreEvents, sports, teams, users } from '@/lib/db/schema'

export async function getPublicEvent(eventId: string) {
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), sql`${events.status} <> 'ARCHIVED'`)).limit(1)
  return event
}

export async function listPublicMatches(eventId: string) {
  return db.select({ match: matches, sport: sports.name, court: courts.name, homeTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'HOME' then ${teams.name} end)`, awayTeam: sql<string | null>`max(case when ${matchParticipants.participantKey} = 'AWAY' then ${teams.name} end)`, scorer: sql<string | null>`max(${users.displayName})`, homeScore: sql<number>`coalesce(max(case when ${matchParticipants.participantKey} = 'HOME' then ${matchStates.homeScore} end), 0)`, awayScore: sql<number>`coalesce(max(case when ${matchParticipants.participantKey} = 'AWAY' then ${matchStates.awayScore} end), 0)` }).from(matches).innerJoin(eventSports, eq(eventSports.eventId, matches.eventId)).innerJoin(sports, eq(sports.id, eventSports.sportId)).leftJoin(courts, eq(courts.id, matches.courtId)).leftJoin(matchParticipants, eq(matchParticipants.matchId, matches.id)).leftJoin(teams, eq(teams.id, matchParticipants.teamId)).leftJoin(matchStates, eq(matchStates.matchId, matches.id)).leftJoin(matchScorers, and(eq(matchScorers.matchId, matches.id), eq(matchScorers.status, 'ACTIVE'))).leftJoin(users, eq(users.id, matchScorers.userId)).where(eq(matches.eventId, eventId)).groupBy(matches.id, sports.name, courts.name).orderBy(asc(matches.scheduledStart))
}

export async function getPublicMatch(eventId: string, matchId: string) {
  const rows = await db.select({ match: matches, sport: sports.name, court: courts.name, participantKey: matchParticipants.participantKey, teamName: teams.name, state: matchStates }).from(matches).innerJoin(eventSports, eq(eventSports.eventId, matches.eventId)).innerJoin(sports, eq(sports.id, eventSports.sportId)).leftJoin(courts, eq(courts.id, matches.courtId)).leftJoin(matchParticipants, eq(matchParticipants.matchId, matches.id)).leftJoin(teams, eq(teams.id, matchParticipants.teamId)).leftJoin(matchStates, eq(matchStates.matchId, matches.id)).where(and(eq(matches.eventId, eventId), eq(matches.id, matchId)))
  return rows
}

export async function listPublicTeams(eventId: string) { return db.select().from(teams).where(and(eq(teams.eventId, eventId), eq(teams.status, 'ACTIVE'))).orderBy(asc(teams.name)) }
export async function listPublicResults(eventId: string) { return (await listPublicMatches(eventId)).filter(({ match }) => match.status === 'COMPLETED') }

export async function listPublicStandings(eventId: string) {
  const rows = await listPublicMatches(eventId)
  const table = new Map<string, { team: string; played: number; wins: number; losses: number; points: number }>()
  for (const row of rows) for (const team of [row.homeTeam, row.awayTeam]) if (team) table.set(team, table.get(team) ?? { team, played: 0, wins: 0, losses: 0, points: 0 })
  for (const row of rows) if (row.match.status === 'COMPLETED' && row.homeTeam && row.awayTeam) { const home = table.get(row.homeTeam)!; const away = table.get(row.awayTeam)!; home.played++; away.played++; if (row.homeScore > row.awayScore) { home.wins++; home.points += 2; away.losses++ } else if (row.awayScore > row.homeScore) { away.wins++; away.points += 2; home.losses++ } else { home.points++; away.points++ } }
  return [...table.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.team.localeCompare(b.team))
}

export async function listPublicScoreEvents(eventId: string, matchId: string) { return db.select({ event: matches.eventId, score: scoreEvents }).from(scoreEvents).innerJoin(matches, eq(matches.id, scoreEvents.matchId)).where(and(eq(matches.eventId, eventId), eq(scoreEvents.matchId, matchId), eq(scoreEvents.status, 'POSTED'))).orderBy(desc(scoreEvents.sequenceNumber)) }
