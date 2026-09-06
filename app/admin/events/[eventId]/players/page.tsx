import { redirect } from 'next/navigation'

export default async function EventPlayersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/players?eventId=${encodeURIComponent(eventId)}`)
}
