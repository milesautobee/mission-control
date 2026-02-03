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
import { Board, Project } from '@/types'
import { Column } from './Column'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'

export function KanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
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
    const project = board?.columns
      .flatMap(col => col.projects)
      .find(p => p.id === active.id)
    setActiveProject(project || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source column
    const sourceColumn = board.columns.find(col =>
      col.projects.some(p => p.id === activeId)
    )
    if (!sourceColumn) return

    // Find destination - could be a column or another project
    let destColumn = board.columns.find(col => col.id === overId)
    if (!destColumn) {
      destColumn = board.columns.find(col =>
        col.projects.some(p => p.id === overId)
      )
    }
    if (!destColumn || sourceColumn.id === destColumn.id) return

    // Move project to new column
    setBoard(prev => {
      if (!prev) return prev
      const newColumns = prev.columns.map(col => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            projects: col.projects.filter(p => p.id !== activeId),
          }
        }
        if (col.id === destColumn!.id) {
          const project = sourceColumn.projects.find(p => p.id === activeId)!
          return {
            ...col,
            projects: [...col.projects, { ...project, columnId: col.id }],
          }
        }
        return col
      })
      return { ...prev, columns: newColumns }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)

    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the column containing the active project
    const column = board.columns.find(col =>
      col.projects.some(p => p.id === activeId)
    )
    if (!column) return

    // Check if dropping on another project in the same column
    const activeIndex = column.projects.findIndex(p => p.id === activeId)
    const overIndex = column.projects.findIndex(p => p.id === overId)

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      // Reorder within column
      const newProjects = arrayMove(column.projects, activeIndex, overIndex)
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col =>
            col.id === column.id ? { ...col, projects: newProjects } : col
          ),
        }
      })
    }

    // Update position in database
    const project = column.projects.find(p => p.id === activeId)
    if (project) {
      const newPosition = column.projects.findIndex(p => p.id === activeId)
      await fetch(`/api/projects/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: column.id,
          position: newPosition,
        }),
      })
    }
  }

  const handleAddProject = (columnId: string) => {
    setEditingProject(null)
    setDefaultColumnId(columnId)
    setModalOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setDefaultColumnId(project.columnId)
    setModalOpen(true)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project and all its tasks?')) return
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          projects: col.projects.filter(p => p.id !== projectId),
        })),
      }
    })
  }

  const handleSaveProject = async (projectData: Partial<Project> & { columnId: string }) => {
    if (editingProject) {
      // Update existing project
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })
      await res.json()
      // Refetch to ensure consistency
      fetchBoard()
    } else {
      // Create new project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })
      const newProject = await res.json()
      setBoard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col =>
            col.id === projectData.columnId
              ? { ...col, projects: [...col.projects, { ...newProject, tasks: [] }] }
              : col
          ),
        }
      })
    }
  }

  // Task handlers
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    // Update local state
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          projects: col.projects.map(p => ({
            ...p,
            tasks: p.tasks?.map(t => 
              t.id === taskId ? { ...t, completed } : t
            ) || [],
          })),
        })),
      }
    })
  }

  const handleTaskAdd = async (projectId: string, title: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title }),
    })
    const newTask = await res.json()
    // Update local state
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          projects: col.projects.map(p => 
            p.id === projectId
              ? { ...p, tasks: [...(p.tasks || []), newTask] }
              : p
          ),
        })),
      }
    })
  }

  const handleTaskDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    // Update local state
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          projects: col.projects.map(p => ({
            ...p,
            tasks: p.tasks?.filter(t => t.id !== taskId) || [],
          })),
        })),
      }
    })
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
              onAddProject={handleAddProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onTaskToggle={handleTaskToggle}
              onTaskAdd={handleTaskAdd}
              onTaskDelete={handleTaskDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && (
            <ProjectCard
              project={activeProject}
              onEdit={() => {}}
              onDelete={() => {}}
              onTaskToggle={() => {}}
              onTaskAdd={() => {}}
              onTaskDelete={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        columns={board.columns}
        defaultColumnId={defaultColumnId}
      />
    </>
  )
}
