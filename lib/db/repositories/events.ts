import { and, desc, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { events, eventMembers, teams, users } from '@/lib/db/schema'

export type EventListItem = typeof events.$inferSelect

export async function listEventsForUser(userId: string, isSuperAdmin = false) {
  return db
    .selectDistinct({ event: events })
    .from(events)
    .leftJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .leftJoin(users, eq(users.id, eventMembers.userId))
    .where(isSuperAdmin ? undefined : and(eq(eventMembers.userId, userId), eq(eventMembers.role, 'EVENT_ADMIN'), eq(users.isActive, true)))
    .orderBy(desc(events.startDate))
}

export async function getEventForUser(eventId: string, userId: string) {
  const rows = await db
    .select({ event: events })
    .from(events)
    .innerJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .innerJoin(users, eq(users.id, eventMembers.userId))
    .where(and(eq(events.id, eventId), eq(eventMembers.userId, userId), eq(eventMembers.role, 'EVENT_ADMIN'), eq(users.isActive, true)))
    .limit(1)

  return rows[0]?.event ?? null
}

export async function listTeamsForEvent(eventId: string, userId: string) {
  return db
    .selectDistinct({ team: teams })
    .from(teams)
    .innerJoin(events, eq(events.id, teams.eventId))
    .innerJoin(eventMembers, eq(eventMembers.eventId, events.id))
    .innerJoin(users, eq(users.id, eventMembers.userId))
    .where(and(eq(teams.eventId, eventId), eq(eventMembers.userId, userId), eq(eventMembers.role, 'EVENT_ADMIN'), eq(users.isActive, true)))
    .orderBy(teams.name)
}
