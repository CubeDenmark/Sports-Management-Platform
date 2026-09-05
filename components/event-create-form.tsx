'use client'

import { useFormStatus } from 'react-dom'
import { createEvent } from '@/app/admin/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? 'Creating…' : 'Create event'}</button>
}

export function EventCreateForm() {
  return <form action={createEvent} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
    <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">Event name<input required name="name" placeholder="Spring Tip-Off" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" /></label>
    <label className="flex flex-col gap-2 text-sm font-medium">Start date<input required type="date" name="startDate" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" /></label>
    <label className="flex flex-col gap-2 text-sm font-medium">End date<input required type="date" name="endDate" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" /></label>
    <label className="flex flex-col gap-2 text-sm font-medium">Location<input name="location" placeholder="Main sports hall" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" /></label>
    <label className="flex flex-col gap-2 text-sm font-medium">Description<input name="description" placeholder="Competition details" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" /></label>
    <div className="flex items-end sm:col-span-2"><SubmitButton /></div>
  </form>
}
