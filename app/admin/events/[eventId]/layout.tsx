import { requireEventAdmin } from '@/lib/authorization'

export default async function EventAdminRouteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  await requireEventAdmin(eventId)
  return children
}
