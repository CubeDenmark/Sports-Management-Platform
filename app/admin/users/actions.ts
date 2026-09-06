'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventMembers, users } from '@/lib/db/schema'
import { getCurrentUser, hashPassword } from '@/lib/auth'

const schema = z.object({ username: z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9._-]+$/), displayName: z.string().trim().min(2).max(160), password: z.string().min(10).max(200), role: z.enum(['SUPER_ADMIN', 'EVENT_ADMIN', 'SCORER']) })

async function requireAdmin() { const user = await getCurrentUser(); if (!user || user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized'); return user }

export async function createUser(formData: FormData) {
  await requireAdmin()
  const input = schema.parse(Object.fromEntries(formData))
  const { password, ...userInput } = input
  await db.insert(users).values({ ...userInput, passwordHash: await hashPassword(password) })
  revalidatePath('/admin/users')
}

export async function assignMembership(formData: FormData) {
  await requireAdmin()
  const input = z.object({ userId: z.string().uuid(), eventId: z.string().uuid(), role: z.enum(['EVENT_ADMIN', 'SCORER']) }).parse(Object.fromEntries(formData))
  const [event, user] = await Promise.all([
    db.query.events.findFirst({ where: (table, { eq }) => eq(table.id, input.eventId) }),
    db.query.users.findFirst({ where: (table, { eq }) => eq(table.id, input.userId) }),
  ])
  if (!event) throw new Error('Selected event was not found.')
  if (!user || user.role === 'SUPER_ADMIN') throw new Error('Only non-admin operator accounts can be assigned to events.')
  await db.insert(eventMembers).values(input).onConflictDoUpdate({ target: [eventMembers.eventId, eventMembers.userId], set: { role: input.role, updatedAt: new Date() } })
  revalidatePath('/admin/users')
}

export async function revokeMembership(formData: FormData) {
  await requireAdmin()
  const input = z.object({ userId: z.string().uuid(), eventId: z.string().uuid() }).parse(Object.fromEntries(formData))
  await db.delete(eventMembers).where(and(eq(eventMembers.eventId, input.eventId), eq(eventMembers.userId, input.userId)))
  revalidatePath('/admin/users')
}

export async function toggleUser(userId: string) {
  const admin = await requireAdmin()
  if (userId === admin.id) throw new Error('You cannot deactivate your own account.')
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (user) await db.update(users).set({ isActive: !user.isActive, updatedAt: new Date() }).where(eq(users.id, userId))
  revalidatePath('/admin/users')
}
