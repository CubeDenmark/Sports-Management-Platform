import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireEventAdmin } from '@/lib/authorization'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { events } from '@/lib/db/schema'
import { getAllSports, getEventSports } from '@/lib/db/repositories/sports'
import { getEventTeams } from '@/lib/db/repositories/teams'
import { getTeamRoster } from '@/lib/db/repositories/players'
import { getEventCourts } from '@/lib/db/repositories/courts'
import { archiveCourtAction, archiveTeamAction, removeRosterPlayer, saveCourt, savePlayer, saveTeam, toggleEventSport } from './actions'

export default async function EventResourcesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  await requireEventAdmin(eventId)
  const [event, allSports, selected, teams, courts] = await Promise.all([
    db.query.events.findFirst({ where: eq(events.id, eventId) }),
    getAllSports(),
    getEventSports(eventId),
    getEventTeams(eventId),
    getEventCourts(eventId),
  ])
  if (!event) notFound()
  const selectedIds = new Set(selected.map(({ sport }) => sport.id))
  const rosters = await Promise.all(teams.map(async (team) => [team.id, await getTeamRoster(team.id)] as const))
  const rosterMap = new Map(rosters)

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div className="flex flex-wrap gap-2"><Link href={`/events/${eventId}`} className="rounded-md bg-muted px-3 py-2 text-sm font-medium">Overview</Link><Link href={`/events/${eventId}/matches`} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Matches & schedule</Link><Link href={`/events/${eventId}/scorers`} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Scorers</Link></div>
        <div className="flex flex-col gap-2"><Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Admin</Link><p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Event configuration</p><h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1><p className="text-muted-foreground">Configure the sports, teams, players, and courts for this event.</p></div>
      </header>
      <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Sports</h2><p className="mt-1 text-sm text-muted-foreground">Choose the sports included in this event.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{allSports.map((sport) => <form action={async () => { 'use server'; await toggleEventSport(eventId, sport.id, !selectedIds.has(sport.id)) }} key={sport.id} className="flex items-center justify-between rounded-lg border border-border p-4"><div><p className="font-medium">{sport.name}</p><p className="text-xs text-muted-foreground">Global catalog</p></div><button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" type="submit">{selectedIds.has(sport.id) ? 'Enabled' : 'Add'}</button></form>)}</div></section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Teams</h2><p className="mt-1 text-sm text-muted-foreground">Teams belong only to this event.</p></div></div><form action={saveTeam} className="mt-5 grid gap-3 sm:grid-cols-[1fr_120px_auto]"><input type="hidden" name="eventId" value={eventId}/><input required name="name" placeholder="Team name" className="rounded-md border border-border bg-background px-3 py-2 text-sm"/><input name="shortName" placeholder="Short name" className="rounded-md border border-border bg-background px-3 py-2 text-sm"/><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">Create</button></form><div className="mt-5 flex flex-col divide-y divide-border">{teams.map((team) => <div className="flex flex-col gap-3 py-4" key={team.id}><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{team.name} {team.shortName && <span className="text-sm text-muted-foreground">({team.shortName})</span>}</p><p className="text-xs text-muted-foreground">{rosterMap.get(team.id)?.length ?? 0} players</p></div><form action={async () => { 'use server'; await archiveTeamAction(eventId, team.id) }}><button className="text-sm text-muted-foreground hover:text-destructive" type="submit">Archive</button></form></div><form action={savePlayer} className="grid gap-2 sm:grid-cols-[1fr_1fr_70px_auto]"><input type="hidden" name="teamId" value={team.id}/><input required name="displayName" placeholder="Player display name" className="rounded-md border border-border bg-background px-3 py-2 text-sm"/><input name="firstName" placeholder="First name" className="rounded-md border border-border bg-background px-3 py-2 text-sm"/><input name="jerseyNumber" type="number" min="0" max="999" placeholder="#" className="rounded-md border border-border bg-background px-3 py-2 text-sm"/><button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted" type="submit">Add player</button></form>{(rosterMap.get(team.id) ?? []).map(({ player, jerseyNumber }) => <div className="flex items-center justify-between pl-2 text-sm" key={player.id}><span>{player.displayName}{jerseyNumber !== null && <span className="ml-2 text-muted-foreground">#{jerseyNumber}</span>}</span><form action={async () => { 'use server'; await removeRosterPlayer(eventId, team.id, player.id) }}><button type="submit" className="text-xs text-muted-foreground hover:text-destructive">Remove</button></form></div>)}</div>)}</div></div>
        <div className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Courts</h2><p className="mt-1 text-sm text-muted-foreground">Manage the playable surfaces for this event.</p><form action={saveCourt} className="mt-5 flex gap-3"><input type="hidden" name="eventId" value={eventId}/><input required name="name" placeholder="Court 1" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"/><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">Create</button></form><div className="mt-5 flex flex-col divide-y divide-border">{courts.map((court) => <div className="flex items-center justify-between py-4" key={court.id}><span className="font-medium">{court.name}</span><form action={async () => { 'use server'; await archiveCourtAction(eventId, court.id) }}><button className="text-sm text-muted-foreground hover:text-destructive" type="submit">Archive</button></form></div>)}</div></div>
      </section>
    </div>
  </main>
}
