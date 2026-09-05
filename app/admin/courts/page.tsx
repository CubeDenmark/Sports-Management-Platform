import { AdminDestination } from '@/components/admin-destination'
import { db } from '@/lib/db'
import { courts, events } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireUser } from '@/lib/authorization'
import { createCourt, deleteCourt } from '@/app/admin/resource-actions'

export default async function CourtsPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const user = await requireUser(); const eventRows = await db.select({ id: events.id, name: events.name }).from(events).orderBy(desc(events.createdAt)); const selectedEventId = (await searchParams).eventId; const eventId = eventRows.some((event) => event.id === selectedEventId) ? selectedEventId : eventRows[0]?.id
  const rows = eventId ? await db.select().from(courts).where(eq(courts.eventId, eventId)).orderBy(courts.name) : []; const canManage = user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN'
  return <AdminDestination eyebrow="Workspace" title="Courts" description="Add the courts and venues used by your event schedule." action={eventId ? <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">{eventRows[0].name}</span> : undefined}>
    {canManage && eventId && <form className="mb-4 rounded-xl border border-border bg-card p-4"><label className="grid gap-2 text-sm"><span className="font-medium">Event workspace</span><select defaultValue={eventId} className="rounded-md border border-input bg-background px-3 py-2" onChange={(event) => { window.location.href = `/admin/courts?eventId=${event.target.value}` }}>{eventRows.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label></form>}{canManage && eventId && <form action={createCourt} className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-5"><input type="hidden" name="eventId" value={eventId}/><input name="name" required placeholder="Court name, e.g. Court 1" className="min-w-64 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"/><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add court</button></form>}
    {!eventId ? <section className="rounded-xl border border-border bg-card p-10 text-center"><p className="font-medium">Create an event first</p></section> : <section className="rounded-xl border border-border bg-card p-5">{rows.length ? <div className="divide-y divide-border">{rows.map((court) => <div key={court.id} className="flex items-center justify-between py-3"><p className="font-medium">{court.name}</p>{canManage && <form action={deleteCourt}><input type="hidden" name="eventId" value={eventId}/><input type="hidden" name="courtId" value={court.id}/><button className="text-sm text-destructive">Remove</button></form>}</div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No courts yet. Use Add court to create one.</p>}</section>}
  </AdminDestination>
}
