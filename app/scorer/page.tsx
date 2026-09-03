import Link from 'next/link'
import { listAssignedMatches } from '@/app/events/[eventId]/match-actions'

export default async function ScorerPage() {
  const assigned = await listAssignedMatches()
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scorer workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">My assigned matches</h1><div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card p-5"><table className="w-full text-left text-sm"><thead className="text-muted-foreground"><tr><th className="pb-3">Event</th><th>Scheduled</th><th>Status</th><th /></tr></thead><tbody>{assigned.map(({ match, eventName }) => <tr className="border-t border-border" key={match.id}><td className="py-3">{eventName}</td><td>{match.scheduledStart?.toLocaleString() ?? 'Unscheduled'}</td><td>{match.status}</td><td><Link className="font-medium hover:underline" href={`/events/${match.eventId}/matches/${match.id}`}>Open</Link></td></tr>)}</tbody></table>{assigned.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matches assigned.</p>}</div></div></main>
}
