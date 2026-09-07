import { requireSuperAdmin } from '@/lib/authorization'
import { AdminShell } from '@/components/admin-shell'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin()
  return <AdminShell user={user} events={[]}>{children}</AdminShell>
}
