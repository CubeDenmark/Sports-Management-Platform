import Link from 'next/link'
import { desc, ne } from 'drizzle-orm'
import { requireUser } from '@/lib/authorization'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'

export default async function LiveEventsPage() {
  await requireUser()
  const rows = await db.select().from(events).where(ne(events.status, 'ARCHIVED')).orderBy(desc(events.startDate))
  return <main className="min-h-screen bg-background px-6 py-12 text-foreground"><div className="mx-auto flex max-w-5xl flex-col gap-8"><header><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Workspace</Link><p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Live events</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Event broadcasts</h1><p className="mt-2 text-muted-foreground">Open a public display for any active event.</p></header><section className="grid gap-4 md:grid-cols-2">{rows.map((event) => <article className="rounded-xl border border-border bg-card p-5" key={event.id}><p className="font-semibold">{event.name}</p><p className="mt-1 text-sm text-muted-foreground">{event.status} · {event.location ?? 'Location TBD'}</p><div className="mt-5 flex gap-3"><Link className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href={`/display/${event.id}`}>Open display</Link><Link className="rounded-md border border-border px-3 py-2 text-sm font-medium" href={`/live/${event.id}`}>Live board</Link></div></article>)}{rows.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">No active events are available yet.</p>}</section></div></main>
}
