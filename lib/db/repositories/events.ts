import { and, desc, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { events, eventMembers, teams } from '@/lib/db/schema'

export type EventListItem = typeof events.$inferSelect

export async function listEventsForUser(userId: string) {
  return db
    .select({ event: events })
    .from(events)
    .leftJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .where(eq(events.createdBy, userId))
    .orderBy(desc(events.startDate))
}

export async function getEventForUser(eventId: string, userId: string) {
  const rows = await db
    .select({ event: events })
    .from(events)
    .leftJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .where(and(eq(events.id, eventId), or(eq(events.createdBy, userId), eq(eventMembers.userId, userId))))
    .limit(1)

  return rows[0]?.event ?? null
}

export async function listTeamsForEvent(eventId: string, userId: string) {
  return db
    .select({ team: teams })
    .from(teams)
    .innerJoin(events, eq(events.id, teams.eventId))
    .leftJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .where(and(eq(teams.eventId, eventId), or(eq(events.createdBy, userId), eq(eventMembers.userId, userId))))
    .orderBy(teams.name)
}
