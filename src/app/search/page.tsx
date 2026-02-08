'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchBar } from '@/components/SearchBar'
import { ViewToggle } from '@/components/ViewToggle'
//  from '@/components/SearchBar'
import { SearchResults } from '@/components/SearchResults'
import { SearchCounts, SearchResult } from '@/types/search'

const DOMAINS = [
  { id: 'memory', label: 'Memory' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'activities', label: 'Activity' },
]

const EMPTY_COUNTS: SearchCounts = {
  memory: 0,
  projects: 0,
  tasks: 0,
  activities: 0,
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [counts, setCounts] = useState<SearchCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    DOMAINS.map(domain => domain.id)
  )

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setCounts(EMPTY_COUNTS)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        params.set('q', trimmed)
        params.set('limit', '50')
        if (selectedDomains.length && selectedDomains.length !== DOMAINS.length) {
          params.set('domains', selectedDomains.join(','))
        }

        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setResults(data.results ?? [])
        setCounts(data.counts ?? EMPTY_COUNTS)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return
        setError('Search is unavailable right now.')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, selectedDomains])

  function toggleDomain(id: string) {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resultCount = useMemo(() => results.length, [results])

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
              <ViewToggle active="search" />

              <SearchBar variant="header" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Global Search</h2>
            <p className="text-sm text-gray-400 mt-1">
              Search across memory, projects, tasks, and activity logs.
            </p>
          </div>

          <SearchBar
            variant="page"
            placeholder="Search everything in Mission Control"
            showShortcut={false}
            defaultValue={query}
            showDropdown={false}
            onQueryChange={setQuery}
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {DOMAINS.map(domain => (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide border transition-colors ${
                  selectedDomains.includes(domain.id)
                    ? 'bg-pink-500/20 text-pink-200 border-pink-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {domain.label}
                <span className="ml-2 text-gray-500">
                  {counts[domain.id as keyof SearchCounts] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          )}

          {!error && (
            <div className="text-sm text-gray-400">
              {query.trim()
                ? `${resultCount} results for "${query.trim()}"`
                : 'Enter a search term to get started.'}
            </div>
          )}

          <SearchResults
            results={results}
            query={query}
            loading={loading}
            emptyMessage={
              query.trim()
                ? 'No results found for that search.'
                : 'Type above to search across the workspace.'
            }
          />
        </div>
      </section>
    </main>
  )
}
