import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING

if (!databaseUrl) {
  throw new Error('Database connection is not configured.')
}

const connectionUrl = new URL(databaseUrl)
connectionUrl.searchParams.delete('sslmode')

export const pool = new Pool({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: false },
})
export const db = drizzle(pool, { schema })
