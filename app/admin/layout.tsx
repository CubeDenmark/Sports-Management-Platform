import { requireAdminWorkspace } from '@/lib/authorization'
import { AdminShell } from '@/components/admin-shell'
import { listEventsForUser } from '@/lib/db/repositories/events'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminWorkspace()
  const assignedEvents = user.role === 'EVENT_ADMIN' ? await listEventsForUser(user.id) : []
  const events = assignedEvents.map(({ event }) => ({ id: event.id, name: event.name }))
  return <AdminShell user={user} events={events}>{children}</AdminShell>
}
