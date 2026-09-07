'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const stored = window.localStorage.getItem('sportsync-theme')
    const preference = stored === 'light' || stored === 'dark' ? stored : 'system'
    const apply = () => root.classList.toggle('dark', preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
    apply()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  return children
}

export function setTheme(value: 'system' | 'light' | 'dark') {
  window.localStorage.setItem('sportsync-theme', value)
  const isDark = value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}
