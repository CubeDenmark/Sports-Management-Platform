import { requireUser } from '@/lib/authorization'
import { AdminShell } from '@/components/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return <AdminShell user={user}>{children}</AdminShell>
}
