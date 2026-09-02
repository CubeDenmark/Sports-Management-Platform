import { db } from './index'
import { seededSports, sports } from './schema'

export async function seedSports() {
  await db.insert(sports).values(seededSports).onConflictDoNothing({ target: sports.slug })
}
