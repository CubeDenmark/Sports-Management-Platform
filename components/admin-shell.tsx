'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logout } from '@/app/logout/actions'

const superAdminNavigation = [
  ['Dashboard', '/super-admin/dashboard'],
  ['Events', '/super-admin/events'],
  ['People', '/super-admin/people'],
  ['Settings', '/super-admin/settings'],
]
const eventAdminNavigation = (eventId: string) => [['Dashboard', `/event-admin/dashboard?eventId=${eventId}`], ['Overview', `/event-admin/overview?eventId=${eventId}`], ['Sports', `/event-admin/sports?eventId=${eventId}`], ['Teams', `/event-admin/teams?eventId=${eventId}`], ['Players', `/event-admin/players?eventId=${eventId}`], ['Courts', `/event-admin/courts?eventId=${eventId}`], ['Matches', `/event-admin/matches?eventId=${eventId}`], ['Schedule', `/event-admin/schedule?eventId=${eventId}`], ['Scorers', `/event-admin/scorers?eventId=${eventId}`], ['Standings', `/event-admin/standings?eventId=${eventId}`], ['Results', `/event-admin/results?eventId=${eventId}`], ['Settings', `/event-admin/settings?eventId=${eventId}`]]
const scorerNavigation = [['My Matches', '/scorer']]

type EventOption = { id: string; name: string }
const system = [['Settings', '/admin/settings']]

function NavGroup({ label, items, pathname, searchParams }: { label: string; items: string[][]; pathname: string; searchParams: URLSearchParams }) {
  const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  return <div className="flex flex-col gap-1"><p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>{items.map(([name, href]) => { const isEventLink = href.startsWith('/event-admin/'); const active = isEventLink ? currentHref === href : pathname === href || (href !== '/super-admin/dashboard' && href !== '/scorer' && pathname.startsWith(href)); return <Link key={href} href={href} className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}>{name}</Link> })}</div>
}

export function AdminShell({ children, user, events = [], eventId: _eventId }: { children: React.ReactNode; user: { displayName: string; role: string }; events?: EventOption[]; eventId?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pathnameEventId = pathname.match(/^\/admin\/events\/([^/]+)/)?.[1]
  const queryEventId = searchParams.get('eventId') ?? undefined
  const routeEventId = pathnameEventId ?? queryEventId
  const [selectedEventId, setSelectedEventId] = useState(routeEventId ?? events[0]?.id ?? '')

  useEffect(() => {
    if (routeEventId && events.some((event) => event.id === routeEventId) && routeEventId !== selectedEventId) setSelectedEventId(routeEventId)
  }, [events, routeEventId, selectedEventId])

  const goToEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    router.push(`/event-admin/overview?eventId=${eventId}`)
  }

  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const initials = user.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="min-h-screen bg-background text-foreground lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2"><div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">SS</div><div><p className="font-semibold tracking-tight">SportSync</p><p className="text-xs text-sidebar-foreground/60">Event operations</p></div></div>
      <nav className="mt-4 flex flex-1 flex-col">{user.role === 'SUPER_ADMIN' ? <><NavGroup label="Platform" items={superAdminNavigation} pathname={pathname} searchParams={searchParams}/><NavGroup label="System" items={system} pathname={pathname} searchParams={searchParams}/></> : user.role === 'EVENT_ADMIN' ? <><div className="flex flex-col gap-2 px-1 pt-6"><label htmlFor="event-selector" className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Event</label><select id="event-selector" value={selectedEventId} disabled={events.length === 0} onChange={(event) => goToEvent(event.target.value)} className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-sm text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring"><option value="">{events.length === 0 ? 'No assigned events' : 'Select an event'}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>{selectedEvent && <p className="truncate px-2 text-xs text-sidebar-foreground/60">{selectedEvent.name}</p>}</div>{selectedEvent ? <NavGroup label="Event operations" items={eventAdminNavigation(selectedEvent.id)} pathname={pathname} searchParams={searchParams}/> : <p className="px-3 pt-6 text-sm text-sidebar-foreground/60">Ask a Super Admin to assign an event.</p>}</> : <NavGroup label="Scorer" items={scorerNavigation} pathname={pathname} searchParams={searchParams}/>}</nav>
      <form action={logout} className="border-t border-sidebar-border pt-4"><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" type="submit">Sign out</button></form>
    </aside>
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    <section className="min-w-0 flex-1"><header className="flex h-20 items-center justify-between border-b border-border px-5 lg:px-8"><div className="flex items-center gap-3"><button aria-label="Open navigation" className="rounded-md border border-border px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}>Menu</button><div><p className="text-xs text-muted-foreground">{user.role === 'SUPER_ADMIN' ? 'Platform administration' : 'Event operations'}</p><h1 className="text-lg font-semibold">Good morning, {user.displayName.split(' ')[0]}</h1></div></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Event Admin'}</span><span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold">{initials}</span></div></header><main className="mx-auto max-w-[1440px] p-5 lg:p-8">{children}</main></section>
  </div>
}

export function AdminCard({ title, value, detail, accent }: { title: string; value: string | number; detail: string; accent?: boolean }) { return <div className={`rounded-xl border p-5 ${accent ? 'border-primary/50 bg-primary/10' : 'border-border bg-card'}`}><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{title}</p><span className="size-2 rounded-full bg-primary" /></div><p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div> }

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) { return <div className="flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-tight">{title}</h2></div>{action}</div> }
