'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMatch } from '@/app/events/[eventId]/match-actions'

type Option = { id: string; name: string }

export function MatchCreateForm({ eventId, sports, teams, courts }: { eventId: string; sports: Option[]; teams: Option[]; courts: Option[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createMatch(eventId, {
          eventSportId: formData.get('eventSportId'),
          homeTeamId: formData.get('homeTeamId'),
          awayTeamId: formData.get('awayTeamId'),
          courtId: formData.get('courtId') || undefined,
          scheduledStart: formData.get('scheduledStart') || undefined,
        })
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to schedule this match.')
      }
    })
  }

  return <>
    <form action={submit} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <select required name="eventSportId" className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">Sport</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select>
      <select required name="homeTeamId" className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">Home team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
      <select required name="awayTeamId" className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">Away team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
      <select name="courtId" className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">Court</option>{courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select>
      <input required name="scheduledStart" type="datetime-local" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
      <button disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{isPending ? 'Checking availability…' : 'Create match'}</button>
    </form>
    {error && <div role="alertdialog" aria-modal="true" aria-labelledby="schedule-conflict-title" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setError(null)}><section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl" onClick={(event) => event.stopPropagation()}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Schedule conflict</p><h3 id="schedule-conflict-title" className="mt-2 text-xl font-semibold">This court is unavailable</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p><button type="button" autoFocus onClick={() => setError(null)} className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Choose another time or court</button></section></div>}
  </>
}
