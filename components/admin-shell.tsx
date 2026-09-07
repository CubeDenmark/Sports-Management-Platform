'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logout } from '@/app/logout/actions'

const superAdminNavigation = [
  ['Dashboard', '/admin'],
  ['Events', '/admin/events'],
  ['People', '/admin/users'],
]
const eventAdminNavigation = (eventId: string) => [['Dashboard', `/admin/events/${eventId}`], ['Overview', `/admin/events/${eventId}/overview`], ['Sports', `/admin/events/${eventId}/sports`], ['Teams', `/admin/events/${eventId}/teams`], ['Players', `/admin/events/${eventId}/players`], ['Courts', `/admin/events/${eventId}/courts`], ['Matches', `/admin/events/${eventId}/matches`], ['Schedule', `/admin/events/${eventId}/schedule`], ['Scorers', `/admin/events/${eventId}/scorers`], ['Standings', `/admin/events/${eventId}/standings`], ['Results', `/admin/events/${eventId}/results`], ['Settings', `/admin/events/${eventId}/settings`]]
const scorerNavigation = [['My Matches', '/scorer']]

type EventOption = { id: string; name: string }
const system = [['Settings', '/admin/settings']]

function NavGroup({ label, items, pathname }: { label: string; items: string[][]; pathname: string }) {
  return <div className="flex flex-col gap-1"><p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>{items.map(([name, href]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}>{name}</Link>)}</div>
}

export function AdminShell({ children, user, events = [], eventId: _eventId }: { children: React.ReactNode; user: { displayName: string; role: string }; events?: EventOption[]; eventId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pathnameEventId = pathname.match(/^\/admin\/events\/([^/]+)/)?.[1]
  const [selectedEventId, setSelectedEventId] = useState(pathnameEventId ?? events[0]?.id ?? '')

  useEffect(() => {
    if (pathnameEventId && pathnameEventId !== selectedEventId) setSelectedEventId(pathnameEventId)
  }, [pathnameEventId, selectedEventId])

  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const initials = user.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="min-h-screen bg-background text-foreground lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2"><div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">SS</div><div><p className="font-semibold tracking-tight">SportSync</p><p className="text-xs text-sidebar-foreground/60">Event operations</p></div></div>
      <nav className="mt-4 flex flex-1 flex-col">{user.role === 'SUPER_ADMIN' ? <><NavGroup label="Platform" items={superAdminNavigation} pathname={pathname}/><NavGroup label="System" items={system} pathname={pathname}/></> : user.role === 'EVENT_ADMIN' ? <><div className="flex flex-col gap-2 px-1 pt-6"><label htmlFor="event-selector" className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Event</label><select id="event-selector" value={selectedEventId} disabled={events.length === 0} onChange={(event) => { setSelectedEventId(event.target.value); router.push(`/admin/events/${event.target.value}`) }} className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-sm text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring"><option value="">{events.length === 0 ? 'No assigned events' : 'Select an event'}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>{selectedEvent && <p className="truncate px-2 text-xs text-sidebar-foreground/60">{selectedEvent.name}</p>}</div>{selectedEvent ? <NavGroup label="Event operations" items={eventAdminNavigation(selectedEvent.id)} pathname={pathname}/> : <p className="px-3 pt-6 text-sm text-sidebar-foreground/60">Ask a Super Admin to assign an event.</p>}</> : <NavGroup label="Scorer" items={scorerNavigation} pathname={pathname}/>}</nav>
      <form action={logout} className="border-t border-sidebar-border pt-4"><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" type="submit">Sign out</button></form>
    </aside>
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    <section className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between border-b border-border px-5 lg:px-8"><div className="flex items-center gap-3"><button aria-label="Open navigation" className="rounded-md border border-border px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}>Menu</button><div><p className="text-xs text-muted-foreground">{user.role === 'SUPER_ADMIN' ? 'Platform administration' : 'Event operations'}</p><h1 className="text-lg font-semibold">Good morning, {user.displayName.split(' ')[0]}</h1></div></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Event Admin'}</span><span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold">{initials}</span></div></header><main className="mx-auto max-w-[1440px] p-5 lg:p-8">{children}</main></section>
  </div>
}

export function AdminCard({ title, value, detail, accent }: { title: string; value: string | number; detail: string; accent?: boolean }) { return <div className={`rounded-xl border p-5 ${accent ? 'border-primary/50 bg-primary/10' : 'border-border bg-card'}`}><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{title}</p><span className="size-2 rounded-full bg-primary" /></div><p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div> }

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) { return <div className="flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-tight">{title}</h2></div>{action}</div> }
