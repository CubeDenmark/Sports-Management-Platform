import { requireEventAdminWorkspace } from '@/lib/authorization'
import { AdminShell } from '@/components/admin-shell'

export default async function EventAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEventAdminWorkspace()
  return <AdminShell user={user}>{children}</AdminShell>
}
