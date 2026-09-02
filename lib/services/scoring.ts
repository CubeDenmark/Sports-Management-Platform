import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matchScorers, matches, scoreEvents } from '@/lib/db/schema'

export async function canScoreMatch(matchId: string, userId: string) {
  const rows = await db
    .select({ matchId: matchScorers.matchId })
    .from(matchScorers)
    .innerJoin(matches, eq(matches.id, matchScorers.matchId))
    .where(and(eq(matchScorers.matchId, matchId), eq(matchScorers.userId, userId), eq(matchScorers.status, 'ACTIVE')))
    .limit(1)

  return rows.length > 0
}

export async function listScoreEvents(matchId: string, userId: string) {
  if (!(await canScoreMatch(matchId, userId))) throw new Error('Unauthorized')
  return db.select().from(scoreEvents).where(eq(scoreEvents.matchId, matchId)).orderBy(desc(scoreEvents.sequenceNumber))
}

export async function appendScoreEvent(input: {
  matchId: string
  userId: string
  clientEventId: string
  participantKey: string
  eventType: string
  points: number
  period?: number
  metadata?: Record<string, unknown>
}) {
  if (!Number.isInteger(input.points) || input.points < 0) throw new Error('Points must be a non-negative integer')
  if (!(await canScoreMatch(input.matchId, input.userId))) throw new Error('Unauthorized')

  const nextSequence = db.$count(scoreEvents, eq(scoreEvents.matchId, input.matchId))
  const [inserted] = await db
    .insert(scoreEvents)
    .values({
      matchId: input.matchId,
      clientEventId: input.clientEventId,
      participantKey: input.participantKey,
      eventType: input.eventType,
      points: input.points,
      period: input.period,
      metadata: input.metadata,
      sequenceNumber: sql`(${nextSequence}) + 1`,
      createdBy: input.userId,
    })
    .onConflictDoNothing({ target: [scoreEvents.matchId, scoreEvents.clientEventId] })
    .returning()

  return inserted ?? null
}
