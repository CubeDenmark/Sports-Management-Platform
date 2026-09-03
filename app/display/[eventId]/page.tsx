import { notFound } from 'next/navigation'
import { getPublicEvent, listPublicMatches } from '@/lib/db/repositories/public-scores'

export const dynamic = 'force-dynamic'

export default async function DisplayPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const [event, matches] = await Promise.all([getPublicEvent(eventId), listPublicMatches(eventId)])
  if (!event) notFound()
  return <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-12"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">SportSync Live Display</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{event.name}</h1><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{matches.map((row) => <article key={row.match.id} className="rounded-2xl border border-border bg-card p-6"><div className="flex justify-between text-sm font-semibold uppercase tracking-wide text-muted-foreground"><span>{row.sport}</span><span>{row.match.status}</span></div><div className="mt-8 grid grid-cols-[1fr_auto] gap-4"><div className="text-xl font-semibold"><p>{row.homeTeam ?? 'Home'}</p><p className="mt-5">{row.awayTeam ?? 'Away'}</p></div><div className="text-4xl font-bold tabular-nums"><p>{row.homeScore}</p><p className="mt-5">{row.awayScore}</p></div></div><p className="mt-8 text-sm text-muted-foreground">{row.court ?? 'Court TBD'}</p></article>)}</div></div></main>
}
