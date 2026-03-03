'use client'

import { useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from '@/components/ViewToggle'

type MemoryTab = 'daily' | 'long-term'

type MemoryEntry = {
  id: string
  filename: string
  content: string
  date: string
  type: string
  createdAt: string
  updatedAt: string
}

function isDailyType(type: string) {
  return type.toLowerCase() === 'daily'
}

function formatMemoryDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MemoryTab>('daily')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        const trimmed = search.trim()
        if (trimmed) params.set('search', trimmed)

        const route = params.size ? `/api/memory?${params.toString()}` : '/api/memory'
        const res = await fetch(route, { signal: controller.signal })
        if (!res.ok) {
          throw new Error('Failed to fetch memory entries')
        }

        const data = await res.json()
        setEntries(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === 'AbortError') return
        setError('Memory is unavailable right now.')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [search])

  const visibleEntries = useMemo(
    () =>
      entries.filter(entry =>
        activeTab === 'daily' ? isDailyType(entry.type) : !isDailyType(entry.type)
      ),
    [entries, activeTab]
  )

  const dailyCount = useMemo(
    () => entries.filter(entry => isDailyType(entry.type)).length,
    [entries]
  )
  const longTermCount = entries.length - dailyCount

  useEffect(() => {
    if (visibleEntries.length === 0) {
      setSelectedEntryId(null)
      return
    }

    const selectionExists = visibleEntries.some(entry => entry.id === selectedEntryId)
    if (!selectedEntryId || !selectionExists) {
      setSelectedEntryId(visibleEntries[0].id)
    }
  }, [visibleEntries, selectedEntryId])

  const selectedEntry = useMemo(
    () => visibleEntries.find(entry => entry.id === selectedEntryId) ?? null,
    [visibleEntries, selectedEntryId]
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-xl font-bold text-white">Mission Control</h1>
              </div>
              <span className="text-gray-500 text-sm hidden sm:block">
                Fast Track Operations Dashboard
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ViewToggle active="memory" />

              <ThemeToggle />

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Memory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Memory Browser</h2>
              <p className="text-sm text-gray-400 mt-1">
                Browse daily notes and long-term memory snapshots.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    activeTab === 'daily'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daily Notes ({dailyCount})
                </button>
                <button
                  onClick={() => setActiveTab('long-term')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    activeTab === 'long-term'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Long-Term Memory ({longTermCount})
                </button>
              </div>

              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search memory content..."
                className="w-full sm:w-80 px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          )}

          {!loading && !error && visibleEntries.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
              <p className="text-white font-medium">No memory entries found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Sync a memory file and it will appear here.
              </p>
            </div>
          )}

          {!loading && !error && visibleEntries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
              <aside className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="max-h-[68vh] overflow-y-auto">
                  {visibleEntries.map(entry => {
                    const selected = entry.id === selectedEntryId
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
                          selected ? 'bg-pink-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white truncate">{entry.filename}</p>
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            {isDailyType(entry.type) ? 'Daily' : 'Long-Term'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{formatMemoryDate(entry.date)}</p>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col min-h-[68vh]">
                {selectedEntry ? (
                  <>
                    <div className="mb-4 border-b border-white/10 pb-3">
                      <h3 className="text-lg text-white font-semibold">{selectedEntry.filename}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatMemoryDate(selectedEntry.date)} •{' '}
                        {isDailyType(selectedEntry.type) ? 'Daily Notes' : 'Long-Term Memory'}
                      </p>
                    </div>

                    <pre className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-gray-200 leading-6">
                      <code>{selectedEntry.content}</code>
                    </pre>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                    Select a memory entry to view its contents.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
