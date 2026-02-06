export type SearchResult = {
  type: 'memory' | 'project' | 'task' | 'activity'
  title: string
  snippet: string
  score: number
  path?: string
  line?: number
  id?: string
  timestamp?: string
}

export type SearchCounts = {
  memory: number
  projects: number
  tasks: number
  activities: number
}
