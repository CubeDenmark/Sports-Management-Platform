import { NextResponse } from 'next/server'
import { getPublicEvent, isPublicId, listPublicMatches } from '@/lib/db/repositories/public-scores'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  if (!isPublicId(eventId)) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!(await getPublicEvent(eventId))) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  return NextResponse.json(await listPublicMatches(eventId), { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
