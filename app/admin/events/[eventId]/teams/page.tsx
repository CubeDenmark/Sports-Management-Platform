import { redirect } from 'next/navigation'

export default async function EventTeamsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/teams?eventId=${encodeURIComponent(eventId)}`)
}
