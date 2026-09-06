import { redirect } from 'next/navigation'

export default async function EventSchedulePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/schedule?eventId=${encodeURIComponent(eventId)}`)
}
