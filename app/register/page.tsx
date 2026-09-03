'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register, type RegisterState } from './actions'

const initialState: RegisterState = {}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, initialState)
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">SportSync</p>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Join the event operations workspace.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="displayName">Display name<input id="displayName" name="displayName" required autoComplete="name" className="rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="username">Username<input id="username" name="username" required autoComplete="username" pattern="[a-zA-Z0-9_]+" className="rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">Password<input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="confirmPassword">Confirm password<input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label>
        {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></p>
      </form>
    </main>
  )
}
