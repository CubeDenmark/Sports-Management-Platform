'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type MatchRow = { match: { id: string; status: string; scheduledStart: Date | string | null }; sport: string; court: string | null; homeTeam: string | null; awayTeam: string | null; scorer: string | null; homeScore: number; awayScore: number }

export function LiveScores({ eventId, initialMatches }: { eventId: string; initialMatches: MatchRow[] }) {
  const [matches, setMatches] = useState(initialMatches)
  useEffect(() => { const refresh = async () => { const response = await fetch(`/api/live/${eventId}`, { cache: 'no-store' }); if (response.ok) setMatches(await response.json()) }; const timer = window.setInterval(refresh, 5000); return () => window.clearInterval(timer) }, [eventId])
  return <section className="flex flex-col gap-4"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Matches</h2><span className="text-sm text-muted-foreground">Updates every 5 seconds</span></div>{matches.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No matches have been scheduled yet.</div> : <div className="grid gap-4 md:grid-cols-2">{matches.map((row) => <Link key={row.match.id} href={`/live/${eventId}/${row.match.id}`} className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted"><div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground"><span>{row.sport}</span><span>{row.match.status}</span></div><div className="mt-5 flex items-center justify-between gap-4"><div className="min-w-0"><p className="truncate font-medium">{row.homeTeam ?? 'Home'}</p><p className="mt-2 truncate font-medium">{row.awayTeam ?? 'Away'}</p></div><div className="text-right text-2xl font-semibold tabular-nums"><p>{row.homeScore}</p><p className="mt-2">{row.awayScore}</p></div></div><p className="mt-5 text-sm text-muted-foreground">{row.court ?? 'Court TBD'} · {row.match.scheduledStart ? new Date(row.match.scheduledStart).toLocaleString() : 'Time TBD'}</p></Link>)}</div>}</section>
}
