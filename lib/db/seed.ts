import { db } from './index'
import { seededSports, sports, users } from './schema'
import { hashPassword } from '@/lib/auth'

export async function seedSports() {
  await db.insert(sports).values([...seededSports]).onConflictDoNothing({ target: sports.slug })
}

export async function seedDevelopmentUser() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? process.env.SEED_USERNAME)?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD ?? process.env.SEED_PASSWORD
  const displayName = (process.env.SEED_ADMIN_DISPLAY_NAME ?? process.env.SEED_DISPLAY_NAME)?.trim() || username
  if (!username || !password || !displayName) throw new Error('SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are required')
  const passwordHash = await hashPassword(password)
  await db.insert(users).values({ username, passwordHash, displayName, role: 'SUPER_ADMIN' }).onConflictDoUpdate({ target: users.username, set: { passwordHash, displayName, role: 'SUPER_ADMIN', isActive: true, updatedAt: new Date() } })
}
