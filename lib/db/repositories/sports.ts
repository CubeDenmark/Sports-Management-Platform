import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sports, eventSports, events } from '@/lib/db/schema'

export async function getAllSports() {
  return db.select().from(sports).orderBy(sports.name)
}

export async function getEventSports(eventId: string) {
  return db
    .select({ sport: sports })
    .from(eventSports)
    .innerJoin(sports, eq(eventSports.sportId, sports.id))
    .where(eq(eventSports.eventId, eventId))
    .orderBy(sports.name)
}

export async function addSportToEvent(eventId: string, sportId: string) {
  return db.insert(eventSports).values({ eventId, sportId }).onConflictDoNothing()
}

export async function removeSportFromEvent(eventId: string, sportId: string) {
  return db
    .delete(eventSports)
    .where(and(eq(eventSports.eventId, eventId), eq(eventSports.sportId, sportId)))
}

export async function getSportById(sportId: string) {
  const [sport] = await db.select().from(sports).where(eq(sports.id, sportId)).limit(1)
  return sport
}
