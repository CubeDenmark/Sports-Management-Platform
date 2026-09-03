import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicEvent, listPublicMatches, listPublicStandings, listPublicTeams } from '@/lib/db/repositories/public-scores'
import { LiveScores } from '@/components/public-live-scores'

export const dynamic = 'force-dynamic'

export default async function PublicLivePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const [event, matches, standings, teams] = await Promise.all([getPublicEvent(eventId), listPublicMatches(eventId), listPublicStandings(eventId), listPublicTeams(eventId)])
  if (!event) notFound()
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">SportSync Live</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{event.name}</h1><p className="mt-2 text-muted-foreground">Live scores, schedule, and results</p></div><Link href={`/display/${eventId}`} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Display mode</Link></header><LiveScores eventId={eventId} initialMatches={matches} /><section className="grid gap-6 lg:grid-cols-2"><div className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Standings</h2><div className="mt-4 flex flex-col gap-3">{standings.map((row, index) => <div key={row.team} className="flex items-center justify-between border-b border-border pb-3 text-sm"><span><span className="mr-3 text-muted-foreground">{index + 1}</span>{row.team}</span><span className="text-muted-foreground">{row.points} pts · {row.wins}-{row.losses}</span></div>)}</div></div><div className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Teams</h2><div className="mt-4 flex flex-wrap gap-2">{teams.map((team) => <span key={team.id} className="rounded-full bg-muted px-3 py-1.5 text-sm">{team.name}</span>)}</div></div></section></div></main>
}
