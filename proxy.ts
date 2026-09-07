import { NextRequest, NextResponse } from 'next/server'

const eventRoutes: Record<string, string> = {
  dashboard: '/admin',
  teams: '/admin/teams',
  players: '/admin/players',
  courts: '/admin/courts',
  schedule: '/admin/schedule',
  matches: '/events/:eventId/matches',
  overview: '/admin/events/:eventId/overview',
  sports: '/admin/events/:eventId/sports',
  scorers: '/admin/events/:eventId/scorers',
  standings: '/admin/events/:eventId/results',
  results: '/admin/events/:eventId/results',
  settings: '/admin/settings',
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (!pathname.startsWith('/event-admin')) return NextResponse.next()

  const section = pathname.split('/')[2] || 'dashboard'
  const destination = eventRoutes[section]
  if (!destination) return NextResponse.next()

  const eventId = searchParams.get('eventId')
  if (destination.includes(':eventId') && !eventId) return NextResponse.redirect(new URL('/event-admin/dashboard', request.url))

  const target = new URL(destination.replace(':eventId', eventId ?? ''), request.url)
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'eventId') target.searchParams.set(key, value)
  }
  if (section !== 'dashboard') target.searchParams.set('eventId', eventId ?? '')
  return NextResponse.rewrite(target)
}

export const config = { matcher: ['/event-admin/:path*'] }
