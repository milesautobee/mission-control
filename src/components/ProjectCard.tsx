'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Project, PRIORITY_COLORS, ASSIGNEES, Priority } from '@/types'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onTaskToggle: (taskId: string, completed: boolean) => void
  onTaskAdd: (projectId: string, title: string) => void
  onTaskDelete: (taskId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete, onTaskToggle, onTaskAdd, onTaskDelete }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)

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

  const priorityColor = PRIORITY_COLORS[project.priority as Priority]
  const assigneeInfo = project.assignee ? ASSIGNEES[project.assignee as keyof typeof ASSIGNEES] : null
  
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskTitle.trim()) {
      onTaskAdd(project.id, newTaskTitle.trim())
      setNewTaskTitle('')
      setShowAddTask(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-xl overflow-hidden
        bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10
        hover:bg-white/10 hover:border-white/20 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
      `}
    >
      {/* Priority indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: priorityColor }}
      />

      {/* Draggable header area */}
      <div
        {...attributes}
        {...listeners}
        className="p-4 cursor-grab active:cursor-grabbing"
      >
        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <h3 className="font-medium text-white dark:text-white pr-16 mb-2">{project.title}</h3>

        {/* Description preview */}
        {project.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* Labels */}
        {project.labels && project.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.labels.map((label, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar (if has tasks) */}
        {totalTasks > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completedTasks}/{totalTasks}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {assigneeInfo && (
              <span className="flex items-center gap-1">
                <span>{assigneeInfo.emoji}</span>
                <span>{assigneeInfo.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.dueDate && (
              <span className={`${new Date(project.dueDate) < new Date() ? 'text-red-400' : ''}`}>
                {format(new Date(project.dueDate), 'MMM d')}
              </span>
            )}
            {totalTasks > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable tasks section */}
      {(isExpanded || totalTasks === 0) && (
        <div className="border-t border-white/10 px-4 pb-4">
          {/* Task list */}
          {project.tasks && project.tasks.length > 0 && (
            <ul className="mt-3 space-y-2">
              {project.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 group/task">
                  <button
                    onClick={() => onTaskToggle(task.id, !task.completed)}
                    className={`
                      w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                      transition-colors
                      ${task.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-500 hover:border-pink-500'}
                    `}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => onTaskDelete(task.id)}
                    className="opacity-0 group-hover/task:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add task form */}
          {showAddTask ? (
            <form onSubmit={handleAddTask} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task..."
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }}
                className="px-2 py-1.5 text-sm text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddTask(true)}
              className="mt-3 w-full py-1.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}
