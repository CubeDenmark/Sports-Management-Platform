import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { eventMembers, events } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireSuperAdmin() {
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') redirect('/')
  return user
}

export async function requireEventAdmin(eventId: string) {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return user
  const rows = await db.select({ id: events.id }).from(events).leftJoin(eventMembers, eq(eventMembers.eventId, events.id)).where(and(eq(events.id, eventId), sql`(${events.createdBy} = ${user.id} OR (${eventMembers.userId} = ${user.id} AND ${eventMembers.role} = 'EVENT_ADMIN'))`)).limit(1)
  if (!rows[0]) redirect('/')
  return user
}

export async function canManageEvent(eventId: string, userId: string) {
  const rows = await db.select({ id: events.id }).from(events).leftJoin(eventMembers, eq(eventMembers.eventId, events.id)).where(and(eq(events.id, eventId), sql`(${events.createdBy} = ${userId} OR (${eventMembers.userId} = ${userId} AND ${eventMembers.role} = 'EVENT_ADMIN'))`)).limit(1)
  return Boolean(rows[0])
}

export const roleLabels = { SUPER_ADMIN: 'Super Admin', EVENT_ADMIN: 'Event Admin', SCORER: 'Scorer' } as const
export type Role = keyof typeof roleLabels
export const unauthorizedMessage = 'You do not have permission to perform this action.'
