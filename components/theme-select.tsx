'use client'

import { useEffect, useState } from 'react'
import { setTheme } from './theme-provider'

export function ThemeSelect() {
  const [value, setValue] = useState<'system' | 'light' | 'dark'>('system')
  useEffect(() => {
    const stored = window.localStorage.getItem('sportsync-theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') setValue(stored)
  }, [])
  return <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="theme"><span>Theme</span><select id="theme" value={value} onChange={(event) => { const next = event.target.value as 'system' | 'light' | 'dark'; setValue(next); setTheme(next) }} className="max-w-xs rounded-md border border-input bg-background px-3 py-2 font-normal"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><span className="text-xs font-normal text-muted-foreground">Your appearance preference persists across navigation and refreshes.</span></label>
}
