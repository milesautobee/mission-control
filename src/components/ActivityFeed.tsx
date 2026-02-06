'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActivityItem } from '@/components/ActivityItem'

type Activity = {
  id: string
  timestamp: string
  action: string
  category: string
  title: string
  description?: string | null
  metadata?: unknown | null
  sessionId?: string | null
  status: string
}

const CATEGORY_FILTERS = [
  'all',
  'files',
  'messaging',
  'cron',
  'tasks',
  'browser',
  'search',
  'system',
  'external',
]

const STATUS_FILTERS = ['all', 'success', 'error', 'pending']

const RANGE_FILTERS: { label: string; value: number }[] = [
  { label: 'All time', value: 0 },
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
]

function buildSince(days: number) {
  if (!days) return null
  const now = new Date()
  now.setDate(now.getDate() - days)
  return now.toISOString()
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [rangeDays, setRangeDays] = useState(7)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchActivity() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', '75')
        if (category !== 'all') params.set('category', category)
        if (status !== 'all') params.set('status', status)
        const since = buildSince(rangeDays)
        if (since) params.set('since', since)

        const res = await fetch(`/api/activity?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error('Failed to load activity')
        }
        const data = await res.json()
        setActivities(data)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        setError('Unable to load activity feed right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()

    return () => controller.abort()
  }, [category, status, rangeDays])

  const filteredActivities = useMemo(() => {
    if (!query.trim()) return activities
    const lowered = query.toLowerCase()
    return activities.filter(activity =>
      [activity.title, activity.description, activity.action, activity.category]
        .filter((value): value is string => Boolean(value))
        .some(value => value.toLowerCase().includes(lowered))
    )
  }, [activities, query])

  return (
    <section className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Activity Feed</h2>
              <p className="text-sm text-gray-400">
                Timeline of actions across Mission Control.
              </p>
            </div>
            <div className="text-sm text-gray-400">
              {filteredActivities.length} events
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-400">Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, action, category..."
                className="bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {RANGE_FILTERS.map(range => (
                <button
                  key={range.label}
                  onClick={() => setRangeDays(range.value)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    rangeDays === range.value
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map(item => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide border transition-colors ${
                  category === item
                    ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(item => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide border transition-colors ${
                  status === item
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-gray-400">
              Loading activity feed...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && filteredActivities.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-gray-400">
              No activity yet. Once actions are logged, they will appear here.
            </div>
          )}

          <div className="space-y-6">
            {filteredActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
