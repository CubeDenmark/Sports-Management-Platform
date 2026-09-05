import { AdminDestination } from '@/components/admin-destination'
import { db } from '@/lib/db'
import { events, teams } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireUser } from '@/lib/authorization'
import { createTeam, deleteTeam } from '@/app/admin/resource-actions'
import Link from 'next/link'

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const user = await requireUser()
  const eventRows = await db.select({ id: events.id, name: events.name }).from(events).orderBy(desc(events.createdAt))
  const selectedEventId = (await searchParams).eventId
  const eventId = eventRows.some((event) => event.id === selectedEventId) ? selectedEventId : eventRows[0]?.id
  const rows = eventId ? await db.select().from(teams).where(eq(teams.eventId, eventId)).orderBy(teams.name) : []
  const canManage = user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN'
  return <AdminDestination eyebrow="Workspace" title="Teams" description="Create event teams and start building their rosters." action={canManage && eventId ? <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">{eventRows[0].name}</span> : undefined}>
    {canManage && eventId && <><form className="mb-4 rounded-xl border border-border bg-card p-4"><label className="grid gap-2 text-sm"><span className="font-medium">Event workspace</span><select defaultValue={eventId} className="rounded-md border border-input bg-background px-3 py-2" onChange={(event) => { window.location.href = `/admin/teams?eventId=${event.target.value}` }} >{eventRows.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label></form><form action={createTeam} className="grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_180px_auto]"><input type="hidden" name="eventId" value={eventId}/><input name="name" required placeholder="Team name" className="rounded-md border border-input bg-background px-3 py-2 text-sm"/><input name="shortName" placeholder="Short name" className="rounded-md border border-input bg-background px-3 py-2 text-sm"/><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add team</button></form></>}
    {!eventId ? <section className="rounded-xl border border-border bg-card p-10 text-center"><p className="font-medium">Create an event first</p></section> : <section className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{rows.length} team{rows.length === 1 ? '' : 's'}</h2><a href="/admin/players" className="text-sm text-primary">Manage players</a></div>{rows.length ? <div className="divide-y divide-border">{rows.map((team) => <div key={team.id} className="flex items-center justify-between py-3"><div><p className="font-medium">{team.name}</p><p className="text-xs text-muted-foreground">{team.shortName || 'No short name'}</p></div>{canManage && <form action={deleteTeam}><input type="hidden" name="eventId" value={eventId}/><input type="hidden" name="teamId" value={team.id}/><button className="text-sm text-destructive">Delete</button></form>}</div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No teams yet. Use Add team to create the first one.</p>}</section>}
  </AdminDestination>
}
