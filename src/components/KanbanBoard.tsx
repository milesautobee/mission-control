'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Board, Task, Column as ColumnType } from '@/types'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'

export function KanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = board?.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source column
    const sourceColumn = board.columns.find(col =>
      col.tasks.some(t => t.id === activeId)
    )
    if (!sourceColumn) return

    // Find destination - could be a column or another task
    let destColumn = board.columns.find(col => col.id === overId)
    if (!destColumn) {
      destColumn = board.columns.find(col =>
        col.tasks.some(t => t.id === overId)
      )
    }
    if (!destColumn || sourceColumn.id === destColumn.id) return

    // Move task to new column
    setBoard(prev => {
      if (!prev) return prev
      const newColumns = prev.columns.map(col => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== activeId),
          }
        }
        if (col.id === destColumn!.id) {
          const task = sourceColumn.tasks.find(t => t.id === activeId)!
          return {
            ...col,
            tasks: [...col.tasks, { ...task, columnId: col.id }],
          }
        }
        return col
      })
      return { ...prev, columns: newColumns }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the column containing the active task
    const column = board.columns.find(col =>
      col.tasks.some(t => t.id === activeId)
    )
    if (!column) return

    // Check if dropping on another task in the same column
    const activeIndex = column.tasks.findIndex(t => t.id === activeId)
    const overIndex = column.tasks.findIndex(t => t.id === overId)

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      // Reorder within column
      const newTasks = arrayMove(column.tasks, activeIndex, overIndex)
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col =>
            col.id === column.id ? { ...col, tasks: newTasks } : col
          ),
        }
      })
    }

    // Update position in database
    const task = column.tasks.find(t => t.id === activeId)
    if (task) {
      const newPosition = column.tasks.findIndex(t => t.id === activeId)
      await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: column.id,
          position: newPosition,
        }),
      })
    }
  }

  const handleAddTask = (columnId: string) => {
    setEditingTask(null)
    setDefaultColumnId(columnId)
    setModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setDefaultColumnId(task.columnId)
    setModalOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId),
        })),
      }
    })
  }

  const handleSaveTask = async (taskData: Partial<Task> & { columnId: string }) => {
    if (editingTask) {
      // Update existing task
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      const updated = await res.json()
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col => ({
            ...col,
            tasks: col.id === taskData.columnId
              ? col.tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t)
                  .concat(col.id !== editingTask.columnId ? [] : [])
              : col.tasks.filter(t => t.id !== updated.id),
          })),
        }
      })
      // Refetch to ensure consistency
      fetchBoard()
    } else {
      // Create new task
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      const newTask = await res.json()
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col =>
            col.id === taskData.columnId
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col
          ),
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Failed to load board
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 p-6 overflow-x-auto min-h-[calc(100vh-120px)]">
          {board.columns.map(column => (
            <Column
              key={column.id}
              column={column}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        columns={board.columns}
        defaultColumnId={defaultColumnId}
      />
    </>
  )
}
