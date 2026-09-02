'use server'

import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { createSession, verifyPassword } from '@/lib/auth'

export type LoginState = { error?: string }

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) return { error: 'Invalid username or password.' }

  const result = await db.select().from(users).where(and(eq(users.username, username), eq(users.isActive, true))).limit(1)
  const user = result[0]
  const valid = user ? await verifyPassword(user.passwordHash, password) : false
  if (!valid) return { error: 'Invalid username or password.' }

  await createSession(user.id)
  redirect('/')
}
