'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchResults } from '@/components/SearchResults'
import { SearchResult } from '@/types/search'

export function SearchBar({
  className,
  placeholder = 'Search memory, tasks, activity...',
  variant = 'header',
  showShortcut = true,
  autoFocus = false,
  defaultValue = '',
  showDropdown,
  onQueryChange,
}: {
  className?: string
  placeholder?: string
  variant?: 'header' | 'page'
  showShortcut?: boolean
  autoFocus?: boolean
  defaultValue?: string
  showDropdown?: boolean
  onQueryChange?: (value: string) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const enableDropdown = showDropdown ?? variant === 'header'

  useEffect(() => {
    setQuery(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!enableDropdown) return
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setResults(data.results ?? [])
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, enableDropdown])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setOpen(false)
  }

  function handleChange(value: string) {
    setQuery(value)
    onQueryChange?.(value)
    if (enableDropdown) setOpen(true)
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2 text-sm text-white transition focus-within:border-pink-500/50 ${
          variant === 'page' ? 'w-full' : 'w-64'
        }`}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => enableDropdown && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
        />
        {showShortcut && variant === 'header' && (
          <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
            ⌘K
          </span>
        )}
      </form>

      {enableDropdown && open && (loading || results.length > 0) && (
        <div className="absolute right-0 mt-3 w-[420px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-gray-400">Quick Results</span>
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              className="text-xs text-pink-300 hover:text-pink-200 transition"
            >
              See all
            </Link>
          </div>
          <SearchResults
            results={results}
            query={query}
            variant="compact"
            loading={loading}
            emptyMessage="No quick matches yet."
          />
        </div>
      )}
    </div>
  )
}
