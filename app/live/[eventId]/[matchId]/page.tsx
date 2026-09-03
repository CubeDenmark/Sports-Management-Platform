import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicEvent, getPublicMatch, isPublicId } from '@/lib/db/repositories/public-scores'

export const dynamic = 'force-dynamic'

export default async function PublicMatchPage({ params }: { params: Promise<{ eventId: string; matchId: string }> }) {
  const { eventId, matchId } = await params
  if (!isPublicId(eventId) || !isPublicId(matchId)) notFound()
  const [event, rows] = await Promise.all([getPublicEvent(eventId), getPublicMatch(eventId, matchId)])
  if (!event || rows.length === 0) notFound()
  const first = rows[0]
  const home = rows.find((row) => row.participantKey === 'HOME')?.teamName ?? 'Home'
  const away = rows.find((row) => row.participantKey === 'AWAY')?.teamName ?? 'Away'
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-3xl"><Link href={`/live/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to live scores</Link><div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-10"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{first.sport}</span><span>{first.match.status}</span></div><div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center"><div><p className="text-xl font-semibold">{home}</p><p className="mt-3 text-5xl font-bold tabular-nums">{first.state?.homeScore ?? 0}</p></div><span className="text-muted-foreground">—</span><div><p className="text-xl font-semibold">{away}</p><p className="mt-3 text-5xl font-bold tabular-nums">{first.state?.awayScore ?? 0}</p></div></div><div className="mt-10 grid gap-3 border-t border-border pt-5 text-sm text-muted-foreground sm:grid-cols-2"><p>Stage: {first.match.stageId ?? '—'}</p><p>Court: {first.court ?? 'TBD'}</p><p>Scheduled: {first.match.scheduledStart ? new Date(first.match.scheduledStart).toLocaleString() : 'TBD'}</p><p>Event: {event.name}</p></div></div></div></main>
}
