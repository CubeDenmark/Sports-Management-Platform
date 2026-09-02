import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import argon2 from 'argon2'
import { db } from '@/lib/db'
import { sessions, users } from '@/lib/db/schema'

const SESSION_COOKIE = 'sportsync_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function verifyPassword(passwordHash: string, password: string) {
  return argon2.verify(passwordHash, password)
}

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1)

  const result = rows[0]
  if (!result || !result.user.isActive) return null
  return { id: result.user.id, username: result.user.username, displayName: result.user.displayName, role: result.user.role }
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  cookieStore.delete(SESSION_COOKIE)
}

export { SESSION_COOKIE }
