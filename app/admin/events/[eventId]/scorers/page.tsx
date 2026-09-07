import { redirect } from 'next/navigation'

export default async function EventScorersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/events/${eventId}/overview`)
}
