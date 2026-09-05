import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { players, teamPlayers } from '@/lib/db/schema'

export async function createPlayer(data: {
  displayName: string
  firstName?: string
  lastName?: string
}) {
  const [player] = await db
    .insert(players)
    .values({
      displayName: data.displayName,
    })
    .returning()
  return player
}

export async function getPlayerById(playerId: string) {
  const [player] = await db
    .select({ id: players.id, displayName: players.displayName })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1)
  return player
}

export async function updatePlayer(playerId: string, data: {
  displayName?: string
}) {
  const [player] = await db
    .update(players)
    .set(data)
    .where(eq(players.id, playerId))
    .returning()
  return player
}

export async function getTeamRoster(teamId: string) {
  return db
    .select({
      player: {
        id: players.id,
        displayName: players.displayName,
      },
      jerseyNumber: teamPlayers.jerseyNumber,
    })
    .from(teamPlayers)
    .innerJoin(players, eq(teamPlayers.playerId, players.id))
    .where(eq(teamPlayers.teamId, teamId))
    .orderBy(players.displayName)
}

export async function assignPlayerToTeam(
  teamId: string,
  playerId: string,
  jerseyNumber?: number,
) {
  return db
    .insert(teamPlayers)
    .values({
      teamId,
      playerId,
      jerseyNumber: jerseyNumber || null,
    })
    .onConflictDoNothing()
}

export async function removePlayerFromTeam(teamId: string, playerId: string) {
  return db
    .delete(teamPlayers)
    .where(and(eq(teamPlayers.teamId, teamId), eq(teamPlayers.playerId, playerId)))
}
