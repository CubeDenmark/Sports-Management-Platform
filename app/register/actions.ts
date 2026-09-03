'use server'

import { count, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSession, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export type RegisterState = { error?: string }

const registrationSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9_]+$/, 'Username must use letters, numbers, or underscores.'),
  displayName: z.string().trim().min(2).max(160),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })

export async function register(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check your details.' }
  const { username, displayName, password } = parsed.data
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  if (existing.length) return { error: 'Unable to create this account. Try another username.' }
  const passwordHash = await hashPassword(password)
  const [user] = await db.transaction(async (tx) => {
    const [{ total }] = await tx.select({ total: count() }).from(users)
    return tx.insert(users).values({ username, displayName, passwordHash, role: total === 0 ? 'SUPER_ADMIN' : 'USER' }).returning({ id: users.id })
  })
  await createSession(user.id)
  redirect('/')
}
