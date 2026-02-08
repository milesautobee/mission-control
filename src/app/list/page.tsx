'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Board } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchBar } from '@/components/SearchBar'
import { ViewToggle } from '@/components/ViewToggle'
import Link from 'next/link'

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'In Progress', label: 'Active' },
  { id: 'To Do', label: 'To Do' },
  { id: 'Backlog', label: 'Backlog' },
]

interface ProjectItem {
  id: string
  title: string
  priority: string
  columnName: string
  columnId: string
  tasks: { id: string; completed: boolean }[]
}

function SortableItem({ project, onMarkDone, doneColumnId }: { 
  project: ProjectItem
  onMarkDone: (id: string) => void
  doneColumnId?: string 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const isInProgress = project.columnName === 'In Progress'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        hover:bg-white/5 transition-colors group
        ${isInProgress ? 'bg-pink-500/10 border border-pink-500/20' : 'border border-transparent'}
        ${isDragging ? 'opacity-50 bg-white/10' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 touch-none"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>

      {/* Checkbox to mark done */}
      <button
        onClick={() => doneColumnId && onMarkDone(project.id)}
        className="w-5 h-5 rounded border border-gray-600 hover:border-green-500 hover:bg-green-500/20 flex items-center justify-center flex-shrink-0 transition-colors"
        title="Mark complete"
      >
        <span className="opacity-0 group-hover:opacity-100 text-green-500 text-xs">✓</span>
      </button>

      {/* Priority dot */}
      <div 
        className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOTS[project.priority]}`} 
        title={project.priority}
      />

      {/* Title */}
      <span className="flex-1 text-white text-sm truncate">{project.title}</span>

      {/* Task progress (if has tasks) */}
      {totalTasks > 0 && (
        <span className="text-xs text-gray-500 tabular-nums">
          {completedTasks}/{totalTasks}
        </span>
      )}

      {/* Status badge */}
      <span className={`
        text-xs px-2 py-0.5 rounded whitespace-nowrap
        ${isInProgress 
          ? 'bg-pink-500/20 text-pink-400' 
          : project.columnName === 'To Do'
            ? 'bg-purple-500/20 text-purple-400'
            : 'bg-white/5 text-gray-500'}
      `}>
        {project.columnName === 'In Progress' ? 'Active' : project.columnName}
      </span>
    </div>
  )
}

export default function ListView() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [projects, setProjects] = useState<ProjectItem[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/board')
      const data = await res.json()
      setBoard(data)
      
      // Flatten projects from all non-Done columns
      const allProjects = data.columns
        ?.filter((c: { name: string }) => c.name !== 'Done')
        .flatMap((c: { name: string; id: string; projects: ProjectItem[] }) => 
          c.projects.map((p: ProjectItem) => ({ 
            ...p, 
            columnName: c.name, 
            columnId: c.id 
          }))
        )
        .sort((a: ProjectItem, b: ProjectItem) => {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        }) || []
      
      setProjects(allProjects)
    } catch (error) {
      console.error('Failed to fetch board:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = projects.findIndex(p => p.id === active.id)
    const newIndex = projects.findIndex(p => p.id === over.id)
    
    const newProjects = arrayMove(projects, oldIndex, newIndex)
    setProjects(newProjects)

    // Update positions in database
    for (let i = 0; i < newProjects.length; i++) {
      await fetch(`/api/projects/${newProjects[i].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: i }),
      })
    }
  }

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
  const doneProjects = board.columns.find(c => c.name === 'Done')?.projects || []

  // Apply filter
  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.columnName === filter)

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
            <div className="flex items-center gap-3">
              <ViewToggle active="list" />
              <SearchBar />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                px-3 py-1.5 text-xs rounded-lg transition-colors
                ${filter === f.id 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'}
              `}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className="ml-1.5 text-gray-500">
                  {projects.filter(p => f.id === 'all' || p.columnName === f.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {filteredProjects.map((project) => (
                <SortableItem
                  key={project.id}
                  project={project}
                  onMarkDone={(id) => doneColumnId && moveProject(id, doneColumnId)}
                  doneColumnId={doneColumnId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filter === 'all' ? 'All clear! 🎉' : `No ${filter} items`}
          </div>
        )}

        {/* Done section (collapsed) */}
        {doneProjects.length > 0 && filter === 'all' && (
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
                  <div className="w-4 h-4" /> {/* Spacer for drag handle */}
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
      </div>
    </main>
  )
}
