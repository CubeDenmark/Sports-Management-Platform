'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

const eventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().trim().max(240).optional(),
  description: z.string().trim().max(5000).optional(),
}).refine((value) => value.endDate >= value.startDate, { message: 'End date must be after start date.' })

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 210) || 'event'
}

async function admin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized')
  return user
}

export async function createEvent(formData: FormData) {
  const user = await admin()
  const input = eventSchema.parse({ name: formData.get('name'), startDate: formData.get('startDate'), endDate: formData.get('endDate'), location: formData.get('location') || undefined, description: formData.get('description') || undefined })
  const slug = `${slugify(input.name)}-${Date.now().toString(36)}`
  const [event] = await db.insert(events).values({ ...input, slug, createdBy: user.id }).returning({ id: events.id })
  revalidatePath('/admin')
  redirect(`/events/${event.id}`)
}

export async function archiveEvent(eventId: string) {
  await admin()
  const parsed = z.string().uuid().parse(eventId)
  await db.update(events).set({ status: 'ARCHIVED', updatedAt: new Date() }).where(and(eq(events.id, parsed), ne(events.status, 'ARCHIVED')))
  revalidatePath('/admin')
  revalidatePath(`/events/${parsed}`)
}
