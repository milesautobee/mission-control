'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Column as ColumnType, Task } from '@/types'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  column: ColumnType
  onAddTask: (columnId: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function Column({ column, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || '#6b7280' }}
          />
          <h2 className="font-semibold text-white">{column.name}</h2>
          <span className="text-sm text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[200px] p-2 rounded-xl transition-colors duration-200
          ${isOver ? 'bg-white/5 ring-2 ring-pink-500/50' : ''}
        `}
      >
        <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
