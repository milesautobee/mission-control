import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { prisma } from '@/lib/prisma'
import { SearchCounts, SearchResult } from '@/types/search'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_LIMIT = 20
const MEMORY_GLOB = 'memory'
const MAX_FILE_BYTES = 300_000

function buildSnippet(line: string, query: string, maxLength = 160) {
  const lowered = line.toLowerCase()
  const index = lowered.indexOf(query.toLowerCase())
  if (index === -1) return line.slice(0, maxLength)
  const start = Math.max(0, index - Math.floor(maxLength / 3))
  const end = Math.min(line.length, start + maxLength)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < line.length ? '...' : ''
  return `${prefix}${line.slice(start, end).trim()}${suffix}`
}

async function exists(filePath: string) {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}

async function collectMemoryFiles(root: string) {
  const files: string[] = []
  const memoryFile = path.join(root, 'MEMORY.md')
  if (await exists(memoryFile)) files.push(memoryFile)

  const memoryDir = path.join(root, MEMORY_GLOB)
  if (await exists(memoryDir)) {
    const entries = await fs.readdir(memoryDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(memoryDir, entry.name))
      }
    }
  }

  return files
}

async function searchMemoryFiles(query: string) {
  const root = process.cwd()
  const files = await collectMemoryFiles(root)
  const results: SearchResult[] = []

  for (const filePath of files) {
    try {
      const stat = await fs.stat(filePath)
      if (stat.size > MAX_FILE_BYTES) continue
      const content = await fs.readFile(filePath, 'utf8')
      const lines = content.split(/\r?\n/)
      let matchCount = 0
      let firstMatchLine = -1
      let matchText = ''

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matchCount += 1
          if (firstMatchLine === -1) {
            firstMatchLine = index
            matchText = line
          }
        }
      })

      if (matchCount === 0) continue

      const fileName = path.basename(filePath)
      const nameMatch = fileName.toLowerCase().includes(query.toLowerCase())
      const score = Math.min(1, 0.55 + matchCount * 0.05 + (nameMatch ? 0.15 : 0))
      const snippet = buildSnippet(matchText, query)

      results.push({
        type: 'memory',
        title: fileName,
        snippet,
        score,
        path: filePath,
        line: firstMatchLine + 1,
      })
    } catch (error) {
      console.error('Failed to search memory file:', filePath, error)
    }
  }

  return results
}

function scoreMatch(text: string | null | undefined, query: string) {
  if (!text) return 0
  const lowered = text.toLowerCase()
  const index = lowered.indexOf(query.toLowerCase())
  if (index === -1) return 0
  const bonus = Math.max(0, 1 - index / Math.max(1, lowered.length))
  return 0.3 + bonus * 0.2
}

function bestSnippet(texts: Array<string | null | undefined>, query: string) {
  for (const text of texts) {
    if (text && text.toLowerCase().includes(query.toLowerCase())) {
      return buildSnippet(text, query)
    }
  }
  return texts.find(Boolean)?.slice(0, 160) ?? ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() ?? ''
    const rawLimit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT)
    const limit = Number.isFinite(rawLimit) ? Math.max(1, rawLimit) : DEFAULT_LIMIT
    const domainParam = searchParams.get('domains')
    const domains = domainParam
      ? new Set(domainParam.split(',').map(item => item.trim()).filter(Boolean))
      : new Set(['memory', 'projects', 'tasks', 'activities'])

    if (!query) {
      return NextResponse.json({
        query,
        results: [],
        counts: { memory: 0, projects: 0, tasks: 0, activities: 0 },
      })
    }

    const results: SearchResult[] = []
    const counts: SearchCounts = {
      memory: 0,
      projects: 0,
      tasks: 0,
      activities: 0,
    }

    if (domains.has('memory')) {
      const memoryResults = await searchMemoryFiles(query)
      results.push(...memoryResults)
      counts.memory = memoryResults.length
    }

    if (domains.has('projects')) {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          dueDate: true,
        },
        take: limit,
      })

      const projectResults = projects.map(project => {
        const titleScore = scoreMatch(project.title, query)
        const descriptionScore = scoreMatch(project.description, query)
        const score = Math.min(1, 0.5 + titleScore + descriptionScore)
        const snippet = bestSnippet([project.description, project.title], query)
        const meta = project.dueDate ? `Due ${project.dueDate.toISOString().slice(0, 10)}` : ''
        return {
          type: 'project' as const,
          title: project.title,
          snippet: meta ? `${snippet} ${meta}`.trim() : snippet,
          score,
          id: project.id,
        }
      })

      results.push(...projectResults)
      counts.projects = projectResults.length
    }

    if (domains.has('tasks')) {
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { project: { title: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          title: true,
          completed: true,
          project: { select: { title: true } },
        },
        take: limit,
      })

      const taskResults = tasks.map(task => {
        const titleScore = scoreMatch(task.title, query)
        const projectScore = scoreMatch(task.project?.title ?? '', query)
        const score = Math.min(1, 0.45 + titleScore + projectScore)
        const snippet = bestSnippet([
          task.title,
          task.project?.title ? `Project: ${task.project.title}` : null,
        ], query)
        return {
          type: 'task' as const,
          title: task.title,
          snippet,
          score,
          id: task.id,
        }
      })

      results.push(...taskResults)
      counts.tasks = taskResults.length
    }

    if (domains.has('activities')) {
      const activities = await prisma.activity.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { action: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          action: true,
          category: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      })

      const activityResults = activities.map(activity => {
        const titleScore = scoreMatch(activity.title, query)
        const descriptionScore = scoreMatch(activity.description, query)
        const actionScore = scoreMatch(activity.action, query)
        const score = Math.min(1, 0.4 + titleScore + descriptionScore + actionScore)
        const snippet = bestSnippet(
          [activity.description, activity.action, activity.category],
          query
        )

        return {
          type: 'activity' as const,
          title: activity.title,
          snippet,
          score,
          id: activity.id,
          timestamp: activity.timestamp.toISOString(),
        }
      })

      results.push(...activityResults)
      counts.activities = activityResults.length
    }

    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      query,
      results: results.slice(0, Math.max(1, limit)),
      counts,
    })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
