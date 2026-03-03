'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { KanbanBoard } from '@/components/KanbanBoard'
import { SearchBar } from '@/components/SearchBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from '@/components/ViewToggle'

type Activity = {
  id: string
  timestamp: string
  title: string
  category: string
  status: string
}

function getActivityDotColor(activity: Activity) {
  if (activity.status === 'error') return 'bg-red-400'
  if (activity.status === 'pending') return 'bg-yellow-400'

  switch (activity.category) {
    case 'tasks':
      return 'bg-emerald-400'
    case 'browser':
      return 'bg-blue-400'
    case 'search':
      return 'bg-fuchsia-400'
    case 'messaging':
      return 'bg-pink-400'
    case 'system':
      return 'bg-slate-400'
    default:
      return 'bg-purple-400'
  }
}

function toRelativeTime(timestamp: string) {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return 'just now'
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    let active = true

    async function fetchActivities() {
      try {
        const res = await fetch('/api/activity?limit=20')
        if (!res.ok) return
        const data = await res.json()
        if (active) {
          setActivities(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to fetch sidebar activity:', error)
      }
    }

    fetchActivities()
    const intervalId = setInterval(fetchActivities, 30000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40 relative">
        <div className="max-w-full mx-auto px-6 py-4 pr-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-xl font-bold text-white">Mission Control</h1>
              </div>
              
              {/* Subtitle */}
              <span className="text-gray-500 text-sm hidden sm:block">
                Fast Track Operations Dashboard
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <ViewToggle active="board" />
              <SearchBar />
              <ThemeToggle />
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Live</span>
                </div>
              </div>

              {/* Avatars */}
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-gray-900 flex items-center justify-center text-sm">
                  👨‍💻
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-gray-900 flex items-center justify-center text-sm">
                  🤖
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg border border-white/15 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={sidebarOpen ? 'Collapse live activity sidebar' : 'Expand live activity sidebar'}
          title={sidebarOpen ? 'Hide live activity' : 'Show live activity'}
        >
          {sidebarOpen ? '›' : '‹'}
        </button>
      </header>

      {/* Board */}
      <div className="flex">
        <div className="flex-1 min-w-0">
          <KanbanBoard />
        </div>

        {sidebarOpen && (
          <aside className="w-72 border-l border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 backdrop-blur-xl p-4 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Live Activity
              </h2>
              <span className="text-xs text-gray-500">{activities.length}</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[calc(100vh-132px)] overflow-y-auto pr-1">
              {activities.map(activity => (
                <article
                  key={activity.id}
                  className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${getActivityDotColor(activity)}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {toRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              {activities.length === 0 && (
                <p className="text-sm text-gray-500 border border-white/10 rounded-lg px-3 py-4">
                  No recent activity.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
