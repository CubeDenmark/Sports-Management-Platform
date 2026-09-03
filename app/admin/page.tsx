import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/authorization'
import { listEventsForUser } from '@/lib/db/repositories/events'
import { archiveEvent, createEvent } from './actions'

export default async function AdminPage() {
  const user = await requireSuperAdmin()
  const events = await listEventsForUser(user.id, true)

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">SportSync Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight">Platform operations</h1>
            <p className="text-muted-foreground">Manage events and access boundaries from one secure workspace.</p>
          </div>
          <Link className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted" href="/">Back to workspace</Link>
        </header>
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-semibold">Create event</h2>
              <p className="text-sm text-muted-foreground">Start a real event workspace backed by the database.</p>
            </div>
            <form action={createEvent} className="grid gap-3 md:grid-cols-4">
              <input name="name" required maxLength={200} placeholder="Event name" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input name="startDate" type="datetime-local" required className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input name="endDate" type="datetime-local" required className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create event</button>
              <input name="location" maxLength={240} placeholder="Location (optional)" className="rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" />
              <input name="description" placeholder="Description (optional)" className="rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" />
            </form>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 pt-6">
            <div>
              <h2 className="font-semibold">Events</h2>
              <p className="text-sm text-muted-foreground">{events.length} events created by your account.</p>
            </div>
          </div>
          {events.length ? <ul className="flex flex-col divide-y divide-border">{events.map(({ event }) => <li className="flex items-center justify-between gap-4 py-4" key={event.id}><div><p className="font-medium">{event.name}</p><p className="text-sm text-muted-foreground">{event.status} · {event.location ?? 'Location TBD'}</p></div><div className="flex items-center gap-4"><span className="text-sm text-muted-foreground">{event.slug}</span><Link className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted" href={`/events/${event.id}`}>Configure</Link>{event.status !== 'ARCHIVED' && <form action={archiveEvent.bind(null, event.id)}><button className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10" type="submit">Archive</button></form>}</div></li>)}</ul> : <p className="py-8 text-sm text-muted-foreground">No events yet. Event creation will be added in the next admin slice.</p>}
        </section>
      </div>
    </main>
  )
}
