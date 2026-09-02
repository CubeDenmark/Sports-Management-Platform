'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">SportSync</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">Access your event operations workspace.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="username">
          Username
          <input id="username" name="username" autoComplete="username" required className="rounded-md border border-input bg-background px-3 py-2 outline-none ring-offset-background focus:ring-2 focus:ring-ring" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
          Password
          <input id="password" name="password" type="password" autoComplete="current-password" required className="rounded-md border border-input bg-background px-3 py-2 outline-none ring-offset-background focus:ring-2 focus:ring-ring" />
        </label>
        {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
