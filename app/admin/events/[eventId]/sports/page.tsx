import { redirect } from 'next/navigation'

export default async function EventSportsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/events/${eventId}/overview`)
}
