import { redirect } from 'next/navigation'

export default async function EventCourtsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/courts?eventId=${encodeURIComponent(eventId)}`)
}
