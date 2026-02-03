'use client'

import { useState, useEffect, useCallback } from 'react'
import { Board } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

export default function ListView() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/board')
      const data = await res.json()
      setBoard(data)
    } catch (error) {
      console.error('Failed to fetch board:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const moveProject = async (projectId: string, newColumnId: string) => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: newColumnId }),
    })
    fetchBoard()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Failed to load
      </div>
    )
  }

  const doneColumnId = board.columns.find(c => c.name === 'Done')?.id
  const inProgressColumnId = board.columns.find(c => c.name === 'In Progress')?.id

  // Get active projects (not in Done)
  const activeProjects = board.columns
    .filter(c => c.name !== 'Done')
    .flatMap(c => c.projects.map(p => ({ ...p, columnName: c.name, columnId: c.id })))
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    })

  const doneProjects = board.columns
    .find(c => c.name === 'Done')
    ?.projects || []

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <h1 className="text-lg font-bold text-white">To-Do</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/" 
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Board View
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Active Items */}
        <div className="space-y-1">
          {activeProjects.map((project) => {
            const completedTasks = project.tasks?.filter(t => t.completed).length || 0
            const totalTasks = project.tasks?.length || 0
            const isInProgress = project.columnName === 'In Progress'

            return (
              <div
                key={project.id}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  hover:bg-white/5 transition-colors group
                  ${isInProgress ? 'bg-white/5' : ''}
                `}
              >
                {/* Checkbox to mark done */}
                <button
                  onClick={() => doneColumnId && moveProject(project.id, doneColumnId)}
                  className="w-5 h-5 rounded border border-gray-600 hover:border-pink-500 flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <span className="opacity-0 group-hover:opacity-100 text-pink-500 text-xs">✓</span>
                </button>

                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOTS[project.priority]}`} />

                {/* Title */}
                <span className="flex-1 text-white text-sm truncate">{project.title}</span>

                {/* Task progress (if has tasks) */}
                {totalTasks > 0 && (
                  <span className="text-xs text-gray-500">
                    {completedTasks}/{totalTasks}
                  </span>
                )}

                {/* Status indicator */}
                <span className={`
                  text-xs px-2 py-0.5 rounded
                  ${isInProgress 
                    ? 'bg-pink-500/20 text-pink-400' 
                    : 'bg-white/5 text-gray-500'}
                `}>
                  {project.columnName === 'In Progress' ? 'Active' : project.columnName}
                </span>

                {/* Quick action to move to In Progress */}
                {!isInProgress && inProgressColumnId && (
                  <button
                    onClick={() => moveProject(project.id, inProgressColumnId)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-pink-400 transition-all"
                    title="Start working"
                  >
                    ▶
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Done section (collapsed) */}
        {doneProjects.length > 0 && (
          <details className="mt-8">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
              Completed ({doneProjects.length})
            </summary>
            <div className="space-y-1 opacity-50">
              {doneProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                >
                  <div className="w-5 h-5 rounded border border-green-600 bg-green-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span className="flex-1 text-gray-400 text-sm line-through truncate">
                    {project.title}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {activeProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            All clear! 🎉
          </div>
        )}
      </div>
    </main>
  )
}
