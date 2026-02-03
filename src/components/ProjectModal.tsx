'use client'

import { useState, useEffect } from 'react'
import { Project, Column, Priority, ASSIGNEES } from '@/types'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (project: Partial<Project> & { columnId: string }) => void
  project?: Project | null
  columns: Column[]
  defaultColumnId?: string
}

export function ProjectModal({ isOpen, onClose, onSave, project, columns, defaultColumnId }: ProjectModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState<string>('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [labels, setLabels] = useState('')
  const [columnId, setColumnId] = useState('')

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description || '')
      setAssignee(project.assignee || '')
      setPriority(project.priority)
      setDueDate(project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '')
      setLabels(project.labels?.join(', ') || '')
      setColumnId(project.columnId)
    } else {
      setTitle('')
      setDescription('')
      setAssignee('')
      setPriority('medium')
      setDueDate('')
      setLabels('')
      setColumnId(defaultColumnId || columns[0]?.id || '')
    }
  }, [project, defaultColumnId, columns])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...(project ? { id: project.id } : {}),
      columnId,
      title,
      description: description || null,
      assignee: assignee || null,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">
          {project ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              placeholder="Project name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
              placeholder="What's this project about?"
            />
          </div>

          {/* Column & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Column</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id} className="bg-gray-900">{col.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="" className="bg-gray-900">Unassigned</option>
                {Object.entries(ASSIGNEES).map(([key, val]) => (
                  <option key={key} value={key} className="bg-gray-900">{val.emoji} {val.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="low" className="bg-gray-900">🟢 Low</option>
                <option value="medium" className="bg-gray-900">🟡 Medium</option>
                <option value="high" className="bg-gray-900">🟠 High</option>
                <option value="urgent" className="bg-gray-900">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Labels (comma separated)</label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g., automation, blog, n8n"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
