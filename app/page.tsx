import { requireAuthenticatedUser } from '@/lib/auth'
import { logout } from './logout/actions'

export default async function Page() {
  const user = await requireAuthenticatedUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-foreground">
      <div className="flex max-w-lg flex-col gap-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">SportSync</p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user.displayName}</h1>
        <p className="text-muted-foreground">Your authenticated event operations workspace is ready.</p>
      </div>
      {user.role === 'SUPER_ADMIN' && <a href="/admin" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Open admin</a>}
      <form action={logout}>
        <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Sign out</button>
      </form>
    </main>
  )
}
