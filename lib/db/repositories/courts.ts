import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courts } from '@/lib/db/schema'

export async function getEventCourts(eventId: string) {
  return db
    .select()
    .from(courts)
    .where(eq(courts.eventId, eventId))
    .orderBy(courts.name)
}

export async function getCourtById(courtId: string) {
  const [court] = await db
    .select()
    .from(courts)
    .where(eq(courts.id, courtId))
    .limit(1)
  return court
}

export async function createCourt(eventId: string, name: string) {
  const [court] = await db
    .insert(courts)
    .values({
      eventId,
      name,
    })
    .returning()
  return court
}

export async function updateCourt(courtId: string, name: string) {
  const [court] = await db
    .update(courts)
    .set({ name })
    .where(eq(courts.id, courtId))
    .returning()
  return court
}

export async function archiveCourt(courtId: string) {
  const [court] = await db.delete(courts).where(eq(courts.id, courtId)).returning()
  return court
}
