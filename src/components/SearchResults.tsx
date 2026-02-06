'use client'

import { SearchResult } from '@/types/search'

const TYPE_STYLES: Record<SearchResult['type'], { label: string; accent: string }> = {
  memory: { label: 'Memory', accent: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  project: { label: 'Project', accent: 'bg-purple-500/20 text-purple-200 border-purple-500/40' },
  task: { label: 'Task', accent: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40' },
  activity: { label: 'Activity', accent: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' },
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig')
  const parts = text.split(regex)
  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="bg-pink-500/30 text-pink-100 px-1 rounded"
        >
          {part}
        </mark>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

export function SearchResults({
  results,
  query,
  variant = 'full',
  loading = false,
  emptyMessage,
}: {
  results: SearchResult[]
  query: string
  variant?: 'compact' | 'full'
  loading?: boolean
  emptyMessage?: string
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-gray-400">
        Searching...
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-gray-400">
        {emptyMessage ?? 'No results yet. Try another search term.'}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-3">
        {results.map(result => (
          <div
            key={`${result.type}-${result.id ?? result.path ?? result.title}`}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  TYPE_STYLES[result.type].accent
                }`}
              >
                {TYPE_STYLES[result.type].label}
              </span>
              <span className="text-sm text-white font-semibold truncate">
                {highlight(result.title, query)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {highlight(result.snippet, query)}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map(result => (
        <div
          key={`${result.type}-${result.id ?? result.path ?? result.title}`}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] uppercase tracking-widest px-2 py-1 rounded-full border ${
                  TYPE_STYLES[result.type].accent
                }`}
              >
                {TYPE_STYLES[result.type].label}
              </span>
              <h3 className="text-lg font-semibold text-white">
                {highlight(result.title, query)}
              </h3>
            </div>
            <span className="text-xs text-gray-500 tabular-nums">
              {Math.round(result.score * 100)}% match
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed">
            {highlight(result.snippet, query)}
          </p>
          {(result.path || result.timestamp) && (
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              {result.path && <span className="truncate">{result.path}</span>}
              {result.timestamp && (
                <span>{new Date(result.timestamp).toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
