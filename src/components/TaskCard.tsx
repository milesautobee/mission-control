'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, PRIORITY_COLORS, ASSIGNEES, Priority } from '@/types'
import { format } from 'date-fns'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColor = PRIORITY_COLORS[task.priority as Priority]
  const assigneeInfo = task.assignee ? ASSIGNEES[task.assignee as keyof typeof ASSIGNEES] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative p-4 rounded-xl cursor-grab active:cursor-grabbing
        bg-white/5 backdrop-blur-sm border border-white/10
        hover:bg-white/10 hover:border-white/20 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
      `}
    >
      {/* Priority indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: priorityColor }}
      />

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h3 className="font-medium text-white pr-16 mb-2">{task.title}</h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              {label}
            </span>
          ))}
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
        {task.dueDate && (
          <span className={`${new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}`}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}
