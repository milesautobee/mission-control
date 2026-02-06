import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, format, startOfWeek } from 'date-fns'

type CronJob = {
  id: string
  name: string
  schedule: string
  enabled?: boolean
  description?: string | null
}

type CalendarEvent = {
  id: string
  type: 'cron' | 'due_date'
  title: string
  date: string
  time?: string | null
  recurrence?: string | null
  priority?: string | null
  status?: 'active' | 'disabled'
  color?: string
}

const DEFAULT_CRON_URL = 'http://localhost:3001/api/cron'

function parseDateOnly(raw: string) {
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateOnly(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function parseCronSchedule(schedule: string) {
  const parts = schedule.trim().split(/\s+/)
  const normalized = parts.length === 6 ? parts.slice(1) : parts
  if (normalized.length < 5) return null

  const [minuteRaw, hourRaw, , , dayOfWeekRaw] = normalized
  const minute = minuteRaw === '*' ? 0 : Number.parseInt(minuteRaw, 10)
  const hour = hourRaw === '*' ? 0 : Number.parseInt(hourRaw, 10)

  if (Number.isNaN(minute) || Number.isNaN(hour)) return null

  let days: number[]
  if (dayOfWeekRaw === '*') {
    days = [0, 1, 2, 3, 4, 5, 6]
  } else if (dayOfWeekRaw.includes(',') || /\d/.test(dayOfWeekRaw)) {
    days = dayOfWeekRaw
      .split(',')
      .map(value => Number.parseInt(value.trim(), 10))
      .filter(value => !Number.isNaN(value))
      .map(value => (value === 7 ? 0 : value))
      .filter(value => value >= 0 && value <= 6)
  } else {
    days = [0, 1, 2, 3, 4, 5, 6]
  }

  if (days.length === 0) {
    days = [0, 1, 2, 3, 4, 5, 6]
  }

  const recurrence = dayOfWeekRaw === '*' ? 'daily' : 'weekly'

  return { minute, hour, days, recurrence }
}

function timeLabel(hour: number, minute: number) {
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${hh}:${mm}`
}

async function fetchCronJobs() {
  const url = process.env.OPENCLAW_CRON_URL || DEFAULT_CRON_URL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Cron API responded ${res.status}`)
    }
    const data = await res.json()
    const jobs = Array.isArray(data) ? data : data?.jobs ?? data?.cronJobs ?? []

    return jobs.map((job: Record<string, unknown>, index: number) => ({
      id: String(job.id ?? job.jobId ?? index),
      name: String(job.name ?? job.title ?? 'Scheduled job'),
      schedule: String(job.schedule ?? job.cron ?? job.expression ?? ''),
      enabled: job.enabled === undefined ? true : Boolean(job.enabled),
      description: typeof job.description === 'string' ? job.description : null,
    })) as CronJob[]
  } catch (error) {
    console.warn('Falling back to mock cron data:', error)
    return [
      {
        id: 'mock-1',
        name: 'Sync Kierra TikTok Videos',
        schedule: '0 4 * * *',
        enabled: true,
      },
      {
        id: 'mock-2',
        name: 'Publish Fast Track Daily Brief',
        schedule: '30 9 * * 1,3,5',
        enabled: true,
      },
      {
        id: 'mock-3',
        name: 'Weekly Metrics Digest',
        schedule: '0 14 * * 5',
        enabled: false,
      },
    ]
  } finally {
    clearTimeout(timeout)
  }
}

function expandCronEvents(jobs: CronJob[], weekStart: Date) {
  const events: CalendarEvent[] = []

  jobs.forEach(job => {
    const parsed = parseCronSchedule(job.schedule)
    if (!parsed) return

    const { minute, hour, days, recurrence } = parsed
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(weekStart, offset)
      if (!days.includes(date.getDay())) continue

      events.push({
        id: `cron-${job.id}-${formatDateOnly(date)}`,
        type: 'cron',
        title: job.name,
        date: formatDateOnly(date),
        time: timeLabel(hour, minute),
        recurrence,
        status: job.enabled === false ? 'disabled' : 'active',
        color: '#fd4987',
      })
    }
  })

  return events
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const rawWeekOf = searchParams.get('weekOf')

    let weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
    if (rawWeekOf) {
      const parsed = parseDateOnly(rawWeekOf)
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid weekOf date' }, { status: 400 })
      }
      weekStart = startOfWeek(parsed, { weekStartsOn: 0 })
    }

    const weekEnd = addDays(weekStart, 7)

    const [projects, cronJobs] = await Promise.all([
      prisma.project.findMany({
        where: {
          dueDate: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
        },
      }),
      fetchCronJobs(),
    ])

    const dueDateEvents: CalendarEvent[] = projects
      .filter(project => project.dueDate)
      .map(project => ({
        id: `proj-${project.id}`,
        type: 'due_date',
        title: project.title,
        date: formatDateOnly(project.dueDate as Date),
        time: format(project.dueDate as Date, 'HH:mm'),
        priority: project.priority,
        status: 'active',
        color: '#6130ba',
      }))

    const cronEvents = expandCronEvents(cronJobs, weekStart)

    const events = [...cronEvents, ...dueDateEvents].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return (a.time ?? '').localeCompare(b.time ?? '')
    })

    return NextResponse.json({
      weekOf: formatDateOnly(weekStart),
      events,
    })
  } catch (error) {
    console.error('Failed to build calendar events:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
}
