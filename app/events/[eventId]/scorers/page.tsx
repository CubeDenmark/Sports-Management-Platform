import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { requireEventAdmin } from '@/lib/authorization'
import { db } from '@/lib/db'
import { eventMembers, events, users } from '@/lib/db/schema'
import { assignMember, removeMember } from './actions'

export default async function ScorersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  await requireEventAdmin(eventId)
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) notFound()
  const [members, available] = await Promise.all([
    db.select({ membership: eventMembers, person: users }).from(eventMembers).innerJoin(users, eq(users.id, eventMembers.userId)).where(eq(eventMembers.eventId, eventId)),
    db.select().from(users).where(eq(users.isActive, true)),
  ])
  const assigned = new Set(members.map(({ person }) => person.id))
  return <main className="min-h-screen bg-background px-6 py-10 text-foreground"><div className="mx-auto flex max-w-5xl flex-col gap-8"><header><Link href={`/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">← {event.name}</Link><p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Event operations</p><h1 className="text-4xl font-semibold tracking-tight">Event team</h1><p className="mt-2 text-muted-foreground">Assign scorer and event-admin access for this event.</p></header><section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Add scorer or event admin</h2><form action={assignMember.bind(null, eventId)} className="mt-5 flex flex-wrap gap-3"><select name="userId" required className="min-w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choose an active account</option>{available.filter((person) => !assigned.has(person.id)).map((person) => <option key={person.id} value={person.id}>{person.displayName} (@{person.username})</option>)}</select><select name="role" defaultValue="SCORER" className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="SCORER">Scorer</option><option value="EVENT_ADMIN">Event admin</option></select><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">Assign access</button></form></section><section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border px-6 py-4"><h2 className="font-semibold">Assigned people ({members.length})</h2></div><div className="divide-y divide-border">{members.length ? members.map(({ membership, person }) => <div className="flex items-center justify-between gap-4 px-6 py-4" key={person.id}><div><p className="font-medium">{person.displayName}</p><p className="text-sm text-muted-foreground">@{person.username} · {membership.role === 'SCORER' ? 'Scorer' : 'Event admin'}</p></div><form action={removeMember.bind(null, eventId, person.id)}><button type="submit" className="text-sm text-destructive hover:underline">Remove</button></form></div>) : <p className="px-6 py-10 text-sm text-muted-foreground">No event staff assigned yet.</p>}</div></section></div></main>
}
