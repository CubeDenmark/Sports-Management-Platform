import { seedDevelopmentUser, seedSports } from '../lib/db/seed'

async function main() {
  await seedDevelopmentUser()
  await seedSports()
  console.log('SportSync seed complete')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
