import { AdminDestination } from '@/components/admin-destination'
import { requireSuperAdmin } from '@/lib/authorization'
import { ThemeSelect } from '@/components/theme-select'

export default async function SettingsPage() {
  await requireSuperAdmin()
  return <AdminDestination eyebrow="System" title="Settings" description="Configure your SportSync workspace without changing operational data."><section className="grid gap-5 md:grid-cols-2"><div className="rounded-xl border border-border bg-card p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Appearance</p><h2 className="mt-2 text-lg font-semibold">Interface preferences</h2><p className="mt-1 mb-5 text-sm text-muted-foreground">Choose the display mode that works best for your workspace.</p><ThemeSelect /></div><div className="rounded-xl border border-border bg-card p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Application</p><h2 className="mt-2 text-lg font-semibold">SportSync</h2><p className="mt-1 text-sm text-muted-foreground">Event operations and live scoring workspace.</p></div></section></AdminDestination>
}
