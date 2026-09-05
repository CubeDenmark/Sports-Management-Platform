'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireEventAdmin } from '@/lib/authorization'
import { matches, teamPlayers, teams } from '@/lib/db/schema'
import * as sportsRepo from '@/lib/db/repositories/sports'
import * as teamsRepo from '@/lib/db/repositories/teams'
import * as playersRepo from '@/lib/db/repositories/players'
import * as courtsRepo from '@/lib/db/repositories/courts'

const teamSchema = z.object({ eventId: z.string().uuid(), name: z.string().trim().min(1).max(160), shortName: z.string().trim().max(40).optional() })
const playerSchema = z.object({ teamId: z.string().uuid(), displayName: z.string().trim().min(1).max(160), firstName: z.string().trim().max(80).optional(), lastName: z.string().trim().max(80).optional(), jerseyNumber: z.coerce.number().int().min(0).max(999).optional() })
const courtSchema = z.object({ eventId: z.string().uuid(), name: z.string().trim().min(1).max(120) })

async function assertEventAdmin(eventId: string) {
  await requireEventAdmin(eventId)
}

export async function toggleEventSport(eventId: string, sportId: string, enabled: boolean) {
  await assertEventAdmin(eventId)
  if (enabled) await sportsRepo.addSportToEvent(eventId, sportId)
  else {
    const historical = await db.select({ id: matches.id }).from(matches).where(eq(matches.eventId, eventId)).limit(1)
    if (historical[0]) throw new Error('Sports with match history cannot be removed.')
    await sportsRepo.removeSportFromEvent(eventId, sportId)
  }
  revalidatePath(`/events/${eventId}`)
}

export async function saveTeam(formData: FormData) {
  const input = teamSchema.parse({ eventId: formData.get('eventId'), name: formData.get('name'), shortName: formData.get('shortName') || undefined })
  await assertEventAdmin(input.eventId)
  await teamsRepo.createTeam(input.eventId, input)
  revalidatePath(`/events/${input.eventId}`)
}

export async function archiveTeamAction(eventId: string, teamId: string) {
  await assertEventAdmin(eventId)
  const [match] = await db.select({ id: matches.id }).from(matches).where(eq(matches.eventId, eventId)).limit(1)
  if (match) throw new Error('Teams with match history cannot be deleted.')
  await teamsRepo.archiveTeam(teamId)
  revalidatePath(`/events/${eventId}`)
}

export async function savePlayer(formData: FormData) {
  const input = playerSchema.parse({ teamId: formData.get('teamId'), displayName: formData.get('displayName'), firstName: formData.get('firstName') || undefined, lastName: formData.get('lastName') || undefined, jerseyNumber: formData.get('jerseyNumber') || undefined })
  const team = await teamsRepo.getTeamById(input.teamId)
  if (!team) throw new Error('Team not found')
  await assertEventAdmin(team.eventId)
  const player = await playersRepo.createPlayer(input)
  await playersRepo.assignPlayerToTeam(input.teamId, player.id, input.jerseyNumber)
  revalidatePath(`/events/${team.eventId}`)
}

export async function removePlayerAction(eventId: string, teamId: string, playerId: string) {
  await assertEventAdmin(eventId)
  await playersRepo.removePlayerFromTeam(teamId, playerId)
  revalidatePath(`/events/${eventId}`)
}

export async function saveCourt(formData: FormData) {
  const input = courtSchema.parse({ eventId: formData.get('eventId'), name: formData.get('name') })
  await assertEventAdmin(input.eventId)
  await courtsRepo.createCourt(input.eventId, input.name)
  revalidatePath(`/events/${input.eventId}`)
}

export async function archiveCourtAction(eventId: string, courtId: string) {
  await assertEventAdmin(eventId)
  await courtsRepo.archiveCourt(courtId)
  revalidatePath(`/events/${eventId}`)
}

export async function removeRosterPlayer(eventId: string, teamId: string, playerId: string) {
  await assertEventAdmin(eventId)
  await db.delete(teamPlayers).where(and(eq(teamPlayers.teamId, teamId), eq(teamPlayers.playerId, playerId)))
  revalidatePath(`/events/${eventId}`)
}

export async function renameTeam(eventId: string, teamId: string, name: string, shortName?: string) {
  await assertEventAdmin(eventId)
  const parsed = z.object({ name: z.string().trim().min(1).max(160), shortName: z.string().trim().max(40).optional() }).parse({ name, shortName })
  await teamsRepo.updateTeam(teamId, parsed)
  revalidatePath(`/events/${eventId}`)
}

export async function renameCourt(eventId: string, courtId: string, name: string) {
  await assertEventAdmin(eventId)
  const parsed = z.string().trim().min(1).max(120).parse(name)
  await courtsRepo.updateCourt(courtId, parsed)
  revalidatePath(`/events/${eventId}`)
}

