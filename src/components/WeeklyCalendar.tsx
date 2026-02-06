'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, addWeeks, format, isToday, startOfWeek } from 'date-fns'
import { CalendarEvent, CalendarEventItem } from '@/components/CalendarEvent'

type CalendarResponse = {
  weekOf: string
  events: CalendarEventItem[]
}

const TYPE_FILTERS = [
  { id: 'cron', label: 'Cron Jobs' },
  { id: 'due_date', label: 'Due Dates' },
] as const

function formatDateOnly(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function WeeklyCalendar() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTypes, setActiveTypes] = useState(() => new Set(['cron', 'due_date']))

  useEffect(() => {
    const controller = new AbortController()

    async function loadCalendar() {
      setLoading(true)
      setError(null)
      try {
        const weekOf = formatDateOnly(weekStart)
        const res = await fetch(`/api/calendar?weekOf=${weekOf}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error('Failed to load calendar data')
        }
        const data: CalendarResponse = await res.json()
        setEvents(data.events ?? [])
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        setError('Unable to load calendar events right now.')
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()

    return () => controller.abort()
  }, [weekStart])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [weekStart])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>()
    events.forEach(event => {
      if (!activeTypes.has(event.type)) return
      const bucket = map.get(event.date) ?? []
      bucket.push(event)
      map.set(event.date, bucket)
    })

    map.forEach((list, key) => {
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
      map.set(key, list)
    })

    return map
  }, [events, activeTypes])

  const weekLabel = `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d')}`

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Weekly Calendar</h2>
              <p className="text-sm text-gray-400">{weekLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, -1))}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-gray-300 hover:text-white"
              >
                ← Prev
              </button>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="px-3 py-1.5 rounded-lg text-xs bg-pink-500/20 border border-pink-500/30 text-pink-200"
              >
                Today
              </button>
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-gray-300 hover:text-white"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {TYPE_FILTERS.map(filter => {
              const isActive = activeTypes.has(filter.id)
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setActiveTypes(prev => {
                      const next = new Set(prev)
                      if (next.has(filter.id)) {
                        next.delete(filter.id)
                      } else {
                        next.add(filter.id)
                      }
                      return next
                    })
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-gray-400">
            Loading calendar...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {days.map(day => {
              const dateKey = formatDateOnly(day)
              const dayEvents = eventsByDate.get(dateKey) ?? []
              const today = isToday(day)

              return (
                <div
                  key={dateKey}
                  className={`rounded-2xl border bg-white/5 backdrop-blur-xl p-4 min-h-[220px] ${
                    today ? 'border-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.25)]' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-lg font-semibold ${today ? 'text-pink-200' : 'text-white'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    {today && (
                      <span className="text-[10px] uppercase tracking-wide text-pink-200 bg-pink-500/20 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {dayEvents.length === 0 && (
                      <div className="text-xs text-gray-500">No events</div>
                    )}
                    {dayEvents.map(event => (
                      <CalendarEvent key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" /> Cron jobs
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Due dates
          </span>
        </div>
      </div>
    </section>
  )
}
