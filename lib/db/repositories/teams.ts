import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { teams } from '@/lib/db/schema'

export async function getEventTeams(eventId: string) {
  return db
    .select()
    .from(teams)
    .where(eq(teams.eventId, eventId))
    .orderBy(teams.name)
}

export async function getTeamById(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
  return team
}

export async function createTeam(eventId: string, data: { name: string; shortName?: string }) {
  const [team] = await db
    .insert(teams)
    .values({
      eventId,
      name: data.name,
      shortName: data.shortName || null,
    })
    .returning()
  return team
}

export async function updateTeam(teamId: string, data: { name?: string; shortName?: string }) {
  const [team] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, teamId))
    .returning()
  return team
}

export async function archiveTeam(teamId: string) {
  const [team] = await db.delete(teams).where(eq(teams.id, teamId)).returning()
  return team
}
