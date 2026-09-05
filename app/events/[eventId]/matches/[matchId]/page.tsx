import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireEventAdmin, requireUser } from '@/lib/authorization'
import { canScoreMatch } from '@/lib/services/scoring'
import { getMatch } from '@/lib/db/repositories/matches'
import { db } from '@/lib/db'
import { eventMembers, users } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { assignScorer } from '../../match-actions'

export default async function MatchDetailPage({ params }: { params: Promise<{ eventId: string; matchId: string }> }) {
  const { eventId, matchId } = await params
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') {
    try { await requireEventAdmin(eventId) } catch { if (!(await canScoreMatch(matchId, user.id))) notFound() }
  }
  const rows = await getMatch(matchId, eventId)
  if (!rows.length) notFound()
  const first = rows[0]
  const canManage = user.role === 'SUPER_ADMIN' || await (async () => { try { await requireEventAdmin(eventId); return true } catch { return false } })()
  const availableScorers = canManage ? await db.select({ id: users.id, displayName: users.displayName, username: users.username }).from(eventMembers).innerJoin(users, eq(users.id, eventMembers.userId)).where(and(eq(eventMembers.eventId, eventId), eq(eventMembers.role, 'SCORER'), eq(users.role, 'SCORER'), eq(users.isActive, true))) : []
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"><div className="mx-auto max-w-3xl"><Link href={`/events/${eventId}/matches`} className="text-sm text-muted-foreground hover:text-foreground">← Matches & schedule</Link><section className="mt-6 rounded-xl border border-border bg-card p-6"><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{first.sport}</p><h1 className="mt-2 text-3xl font-semibold">{rows.find((r) => r.participantKey === 'HOME')?.teamName ?? 'TBD'} <span className="text-muted-foreground">vs</span> {rows.find((r) => r.participantKey === 'AWAY')?.teamName ?? 'TBD'}</h1><dl className="mt-8 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Court</dt><dd className="mt-1 font-medium">{first.court ?? 'Unassigned'}</dd></div><div><dt className="text-sm text-muted-foreground">Scheduled time</dt><dd className="mt-1 font-medium">{first.match.scheduledStart?.toLocaleString() ?? 'Unscheduled'}</dd></div><div><dt className="text-sm text-muted-foreground">Status</dt><dd className="mt-1 font-medium">{first.match.status}</dd></div><div><dt className="text-sm text-muted-foreground">Scorer</dt><dd className="mt-1 font-medium">{first.scorerName ?? 'Unassigned'}</dd></div><div><dt className="text-sm text-muted-foreground">Stage</dt><dd className="mt-1 font-medium">{first.match.stageId ?? 'Not set'}</dd></div></dl></section>{canManage && <section className="mt-6 rounded-xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Assign scorer</h2><p className="mt-1 text-sm text-muted-foreground">Only active SCORER accounts assigned to this event can be selected.</p><form action={async (formData) => { 'use server'; const scorerId = String(formData.get('userId')); if (scorerId) await assignScorer(eventId, matchId, scorerId) }} className="mt-4 flex flex-wrap gap-3"><select name="userId" required className="min-w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choose scorer</option>{availableScorers.map((scorer) => <option key={scorer.id} value={scorer.id}>{scorer.displayName} (@{scorer.username})</option>)}</select><button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Assign scorer</button></form></section>}</div></main>
}
