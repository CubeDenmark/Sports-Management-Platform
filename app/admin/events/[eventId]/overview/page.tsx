import { redirect } from 'next/navigation'

export default async function EventOverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/events/${eventId}`)
}
