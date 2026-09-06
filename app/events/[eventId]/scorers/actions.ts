'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventMembers, matchScorers, matches, users } from '@/lib/db/schema'
import { requireEventAdmin } from '@/lib/authorization'

const roleSchema = z.enum(['SCORER', 'EVENT_ADMIN'])
export async function assignMember(eventId: string, formData: FormData) {
  const actor = await requireEventAdmin(eventId)
  const userId = z.string().uuid().parse(formData.get('userId'))
  const role = roleSchema.parse(formData.get('role'))
  const [target] = await db.select({ role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1)
  if (!target?.isActive || target.role !== role) throw new Error('Select an active account whose role matches the assignment.')
  await db.transaction(async (tx) => {
    await tx.insert(eventMembers).values({ eventId, userId, role }).onConflictDoUpdate({ target: [eventMembers.eventId, eventMembers.userId], set: { role, updatedAt: new Date() } })
    const eventMatches = await tx.select({ id: matches.id }).from(matches).where(eq(matches.eventId, eventId))
    if (role === 'SCORER' && eventMatches.length) {
      await tx.insert(matchScorers).values(eventMatches.map((match) => ({ matchId: match.id, userId, assignedBy: actor.id, status: 'ACTIVE' as const }))).onConflictDoUpdate({ target: [matchScorers.matchId, matchScorers.userId], set: { status: 'ACTIVE', assignedBy: actor.id } })
    } else if (role !== 'SCORER' && eventMatches.length) {
      await tx.update(matchScorers).set({ status: 'REVOKED' }).where(and(eq(matchScorers.userId, userId), inArray(matchScorers.matchId, eventMatches.map((match) => match.id))))
    }
  })
  revalidatePath(`/events/${eventId}/scorers`)
  revalidatePath('/scorer')
}
export async function removeMember(eventId: string, userId: string) {
  await requireEventAdmin(eventId)
  await db.transaction(async (tx) => {
    const eventMatches = await tx.select({ id: matches.id }).from(matches).where(eq(matches.eventId, eventId))
    if (eventMatches.length) {
      await tx.delete(matchScorers).where(and(eq(matchScorers.userId, userId), inArray(matchScorers.matchId, eventMatches.map((match) => match.id))))
    }
    await tx.delete(eventMembers).where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.userId, userId)))
  })
  revalidatePath(`/events/${eventId}/scorers`)
  revalidatePath('/scorer')
}
