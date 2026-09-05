import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { requireEventAdmin } from '@/lib/authorization'
import { db } from '@/lib/db'
import { courts, eventSports, sports, teams } from '@/lib/db/schema'
import { listMatches } from '@/lib/db/repositories/matches'
import { MatchCreateForm } from '@/components/match-create-form'

export default async function MatchesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  await requireEventAdmin(eventId)
  const [rows, sportRows, teamRows, courtRows] = await Promise.all([
    listMatches(eventId),
    db.select({ id: eventSports.sportId, name: sports.name }).from(eventSports).innerJoin(sports, eq(sports.id, eventSports.sportId)).where(eq(eventSports.eventId, eventId)),
    db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.eventId, eventId)),
    db.select({ id: courts.id, name: courts.name }).from(courts).where(eq(courts.eventId, eventId)),
  ])

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"><div className="mx-auto flex max-w-6xl flex-col gap-8"><header><Link href={`/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">← Event configuration</Link><p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Competition</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Matches &amp; schedule</h1></header><section className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Create match</h2><p className="mt-1 text-sm text-muted-foreground">A court can host multiple games at different times. The same court and exact time cannot be scheduled twice.</p><MatchCreateForm eventId={eventId} sports={sportRows} teams={teamRows} courts={courtRows} /></section><section className="overflow-hidden rounded-xl border border-border bg-card">{rows.length ? <div className="divide-y divide-border">{rows.map(({ match, sport, court, homeTeam, awayTeam }) => <Link key={match.id} href={`/events/${eventId}/matches/${match.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/30"><div><p className="font-medium">{homeTeam || 'TBD'} <span className="text-muted-foreground">vs</span> {awayTeam || 'TBD'}</p><p className="mt-1 text-xs text-muted-foreground">{sport} · {court || 'Court TBD'}</p></div><div className="text-right"><p className="text-sm">{match.scheduledStart ? new Date(match.scheduledStart).toLocaleString() : 'Time TBD'}</p><p className="mt-1 text-xs text-muted-foreground">{match.status}</p></div></Link>)}</div> : <p className="p-10 text-center text-sm text-muted-foreground">No matches yet. Use Create match to add the first schedule entry.</p>}</section></div></main>
}
