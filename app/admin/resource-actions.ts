'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireEventAdmin } from '@/lib/authorization'
import { events, matches, teamPlayers, teams } from '@/lib/db/schema'
import * as teamsRepo from '@/lib/db/repositories/teams'
import * as playersRepo from '@/lib/db/repositories/players'
import * as courtsRepo from '@/lib/db/repositories/courts'

const eventIdSchema = z.string().uuid()

export async function createTeam(formData: FormData) {
  const eventId = eventIdSchema.parse(formData.get('eventId'))
  await requireEventAdmin(eventId)
  await teamsRepo.createTeam(eventId, { name: z.string().trim().min(1).parse(formData.get('name')), shortName: String(formData.get('shortName') || '') })
  revalidatePath('/admin/teams')
}

export async function deleteTeam(formData: FormData) {
  const eventId = eventIdSchema.parse(formData.get('eventId')); const teamId = eventIdSchema.parse(formData.get('teamId'))
  await requireEventAdmin(eventId)
  const [match] = await db.select({ id: matches.id }).from(matches).innerJoin(teamPlayers, eq(teamPlayers.teamId, teamId)).where(eq(matches.eventId, eventId)).limit(1)
  if (match) throw new Error('This team is already used by event records.')
  await teamsRepo.archiveTeam(teamId); revalidatePath('/admin/teams')
}

export async function createPlayer(formData: FormData) {
  const eventId = eventIdSchema.parse(formData.get('eventId')); const teamId = eventIdSchema.parse(formData.get('teamId'))
  await requireEventAdmin(eventId)
  const [team] = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.id, teamId), eq(teams.eventId, eventId))).limit(1)
  if (!team) throw new Error('Team does not belong to this event.')
  const player = await playersRepo.createPlayer({ displayName: z.string().trim().min(1).parse(formData.get('displayName')), firstName: String(formData.get('firstName') || ''), lastName: String(formData.get('lastName') || '') })
  await playersRepo.assignPlayerToTeam(teamId, player.id, Number(formData.get('jerseyNumber')) || undefined)
  revalidatePath('/admin/teams'); revalidatePath('/admin/players')
}

export async function createCourt(formData: FormData) {
  const eventId = eventIdSchema.parse(formData.get('eventId')); await requireEventAdmin(eventId)
  await courtsRepo.createCourt(eventId, z.string().trim().min(1).parse(formData.get('name')))
  revalidatePath('/admin/courts')
}

export async function deleteCourt(formData: FormData) {
  const eventId = eventIdSchema.parse(formData.get('eventId')); const courtId = eventIdSchema.parse(formData.get('courtId')); await requireEventAdmin(eventId)
  await courtsRepo.archiveCourt(courtId); revalidatePath('/admin/courts')
}
