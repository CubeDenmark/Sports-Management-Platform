'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventMembers, users } from '@/lib/db/schema'
import { requireEventAdmin } from '@/lib/authorization'

const roleSchema = z.enum(['SCORER', 'EVENT_ADMIN'])
export async function assignMember(eventId: string, formData: FormData) {
  const actor = await requireEventAdmin(eventId)
  const userId = z.string().uuid().parse(formData.get('userId'))
  const role = roleSchema.parse(formData.get('role'))
  await db.insert(eventMembers).values({ eventId, userId, role }).onConflictDoUpdate({ target: [eventMembers.eventId, eventMembers.userId], set: { role, updatedAt: new Date() } })
  revalidatePath(`/events/${eventId}/scorers`)
}
export async function removeMember(eventId: string, userId: string) {
  await requireEventAdmin(eventId)
  await db.delete(eventMembers).where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.userId, userId)))
  revalidatePath(`/events/${eventId}/scorers`)
}
