export interface Task {
  id: string
  projectId: string
  title: string
  completed: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  columnId: string
  title: string
  description: string | null
  assignee: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: Date | null
  position: number
  labels: string[]
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
}

export interface Column {
  id: string
  boardId: string
  name: string
  position: number
  color: string | null
  projects: Project[]
  createdAt: Date
}

export interface Board {
  id: string
  name: string
  columns: Column[]
  createdAt: Date
  updatedAt: Date
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

export const ASSIGNEES = {
  blake: { name: 'Blake', emoji: '👨‍💻' },
  miles: { name: 'Miles', emoji: '🤖' },
} as const
