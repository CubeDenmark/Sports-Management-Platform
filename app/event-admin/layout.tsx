import { requireEventAdminWorkspace } from '@/lib/authorization'
import { listEventsForUser } from '@/lib/db/repositories/events'
import { AdminShell } from '@/components/admin-shell'

export default async function EventAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEventAdminWorkspace()
  const eventRows = await listEventsForUser(user.id)
  const events = eventRows.map(({ event }) => ({ id: event.id, name: event.name }))
  return <AdminShell user={user} events={events}>{children}</AdminShell>
}
