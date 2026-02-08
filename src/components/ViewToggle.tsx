'use client'

import Link from 'next/link'

const VIEWS = [
  { id: 'board', label: 'Board', href: '/' },
  { id: 'list', label: 'List', href: '/list' },
  { id: 'map', label: '🏝️ Islands', href: '/map' },
  { id: 'space', label: '🚀 Station', href: '/space' },
  { id: 'calendar', label: 'Calendar', href: '/calendar' },
  { id: 'activity', label: 'Activity', href: '/activity' },
  { id: 'search', label: 'Search', href: '/search' },
]

export function ViewToggle({ active }: { active: string }) {
  return (
    <div className="flex items-center bg-white/5 rounded-lg p-1">
      {VIEWS.map(view => (
        view.id === active ? (
          <span
            key={view.id}
            className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-md"
          >
            {view.label}
          </span>
        ) : (
          <Link
            key={view.id}
            href={view.href}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {view.label}
          </Link>
        )
      ))}
    </div>
  )
}
