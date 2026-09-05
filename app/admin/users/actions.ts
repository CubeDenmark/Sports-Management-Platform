'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventMembers, users } from '@/lib/db/schema'
import { getCurrentUser, hashPassword } from '@/lib/auth'

const schema = z.object({ username: z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9._-]+$/), displayName: z.string().trim().min(2).max(160), password: z.string().min(10).max(200), role: z.enum(['SUPER_ADMIN', 'EVENT_ADMIN', 'SCORER']), eventId: z.string().uuid().optional() })

async function requireAdmin() { const user = await getCurrentUser(); if (!user || user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized'); return user }

export async function createUser(formData: FormData) {
  await requireAdmin()
  const input = schema.parse(Object.fromEntries(formData))
  const { password, eventId, ...userInput } = input
  const [created] = await db.insert(users).values({ ...userInput, passwordHash: await hashPassword(password) }).returning({ id: users.id })
  if (eventId && input.role !== 'SUPER_ADMIN') {
    await db.insert(eventMembers).values({ eventId, userId: created.id, role: input.role }).onConflictDoUpdate({ target: [eventMembers.eventId, eventMembers.userId], set: { role: input.role, updatedAt: new Date() } })
  }
  revalidatePath('/admin/users')
}

export async function toggleUser(userId: string) {
  const admin = await requireAdmin()
  if (userId === admin.id) throw new Error('You cannot deactivate your own account.')
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (user) await db.update(users).set({ isActive: !user.isActive, updatedAt: new Date() }).where(eq(users.id, userId))
  revalidatePath('/admin/users')
}
