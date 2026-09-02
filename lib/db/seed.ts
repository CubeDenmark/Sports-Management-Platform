import { db } from './index'
import { seededSports, sports, users } from './schema'
import { hashPassword } from '@/lib/auth'

export async function seedSports() {
  await db.insert(sports).values([...seededSports]).onConflictDoNothing({ target: sports.slug })
}

export async function seedDevelopmentUser() {
  const username = process.env.SEED_USERNAME?.trim().toLowerCase()
  const password = process.env.SEED_PASSWORD
  const displayName = process.env.SEED_DISPLAY_NAME?.trim() || username
  if (!username || !password || !displayName) throw new Error('SEED_USERNAME, SEED_PASSWORD, and SEED_DISPLAY_NAME are required')
  await db.insert(users).values({ username, passwordHash: await hashPassword(password), displayName }).onConflictDoNothing({ target: users.username })
}
