import { redirect } from 'next/navigation'

export default async function EventSettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  redirect(`/admin/settings?eventId=${encodeURIComponent(eventId)}`)
}
