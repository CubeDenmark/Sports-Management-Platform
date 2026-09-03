import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireEventAdmin } from '@/lib/authorization'
import { getMatch } from '@/lib/db/repositories/matches'

export default async function MatchDetailPage({ params }: { params: Promise<{ eventId: string; matchId: string }> }) {
  const { eventId, matchId } = await params
  await requireEventAdmin(eventId)
  const rows = await getMatch(matchId, eventId)
  if (!rows.length) notFound()
  const first = rows[0]
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"><div className="mx-auto max-w-3xl"><Link href={`/events/${eventId}/matches`} className="text-sm text-muted-foreground hover:text-foreground">← Matches & schedule</Link><section className="mt-6 rounded-xl border border-border bg-card p-6"><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{first.sport}</p><h1 className="mt-2 text-3xl font-semibold">{rows.find((r) => r.participantKey === 'HOME')?.teamName ?? 'TBD'} <span className="text-muted-foreground">vs</span> {rows.find((r) => r.participantKey === 'AWAY')?.teamName ?? 'TBD'}</h1><dl className="mt-8 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Court</dt><dd className="mt-1 font-medium">{first.court ?? 'Unassigned'}</dd></div><div><dt className="text-sm text-muted-foreground">Scheduled time</dt><dd className="mt-1 font-medium">{first.match.scheduledStart?.toLocaleString() ?? 'Unscheduled'}</dd></div><div><dt className="text-sm text-muted-foreground">Status</dt><dd className="mt-1 font-medium">{first.match.status}</dd></div><div><dt className="text-sm text-muted-foreground">Scorer</dt><dd className="mt-1 font-medium">{first.scorerName ?? 'Unassigned'}</dd></div><div><dt className="text-sm text-muted-foreground">Stage</dt><dd className="mt-1 font-medium">{first.match.stageId ?? 'Not set'}</dd></div></dl></section></div></main>
}
