import { AdminDestination } from '@/components/admin-destination'
import { requireEventAdmin } from '@/lib/authorization'
import { listMatches } from '@/lib/db/repositories/matches'

export default async function EventResultsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  await requireEventAdmin(eventId)
  const matches = await listMatches(eventId)
  const completed = matches.filter(({ match }) => match.status === 'COMPLETED')
  return <AdminDestination eyebrow="Event operations" title="Results" description="Review completed match results for this event."><section className="rounded-xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{completed.length} completed match{completed.length === 1 ? '' : 'es'}</p>{completed.length ? <div className="mt-5 divide-y divide-border">{completed.map(({ match, sport, homeTeam, awayTeam }) => <div key={match.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium">{homeTeam || 'TBD'} <span className="text-muted-foreground">vs</span> {awayTeam || 'TBD'}</p><p className="mt-1 text-xs text-muted-foreground">{sport}</p></div><p className="text-sm font-semibold">Completed</p></div>)}</div> : <p className="mt-6 text-sm text-muted-foreground">No completed results yet.</p>}</section></AdminDestination>
}
