'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

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

const CATEGORY_STYLES: Record<string, { gradient: string; icon: string }> = {
  files: { gradient: 'from-emerald-500 to-cyan-500', icon: '📁' },
  messaging: { gradient: 'from-pink-500 to-purple-500', icon: '💬' },
  cron: { gradient: 'from-purple-500 to-indigo-500', icon: '⏱️' },
  tasks: { gradient: 'from-orange-500 to-pink-500', icon: '✅' },
  browser: { gradient: 'from-blue-500 to-indigo-500', icon: '🌐' },
  search: { gradient: 'from-fuchsia-500 to-pink-500', icon: '🔍' },
  system: { gradient: 'from-gray-500 to-slate-600', icon: '⚙️' },
  external: { gradient: 'from-teal-500 to-emerald-500', icon: '🔌' },
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  error: 'bg-red-500/15 text-red-300 border border-red-500/30',
  pending: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
}

export function ActivityItem({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false)
  const categoryStyle = CATEGORY_STYLES[activity.category] ?? {
    gradient: 'from-gray-500 to-gray-700',
    icon: '•',
  }
  const statusStyle = STATUS_STYLES[activity.status] ?? 'bg-white/10 text-gray-300 border border-white/10'
  const timestamp = new Date(activity.timestamp)
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <div className="relative pl-12">
      <div className={`absolute left-0 top-4 w-8 h-8 rounded-xl bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center text-white text-sm shadow-lg`}>
        <span className="text-sm" aria-hidden>
          {categoryStyle.icon}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              {activity.category} · {activity.action.replace(/_/g, ' ')}
            </p>
            <h3 className="text-lg font-semibold text-white mt-1">{activity.title}</h3>
            {activity.description && (
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusStyle}`}>
              {activity.status}
            </span>
            <span
              className="text-xs text-gray-500"
              title={format(timestamp, 'PPpp')}
            >
              {relativeTime}
            </span>
          </div>
        </div>

        {(activity.metadata || activity.sessionId) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-pink-300 hover:text-pink-200 transition-colors"
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-2 text-xs text-gray-300">
            {activity.sessionId && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Session</span>
                <span className="font-mono text-gray-200">{activity.sessionId}</span>
              </div>
            )}
            {activity.metadata != null && (
              <pre className="rounded-lg bg-black/30 border border-white/10 p-3 overflow-auto text-gray-200">
                {JSON.stringify(activity.metadata as object, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
