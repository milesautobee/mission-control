import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// GET /api/tasks - List tasks (subtasks) for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task (subtask)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'projectId and title are required' },
        { status: 400 }
      )
    }

    // Get the highest position in the project
    const maxPosition = await prisma.task.aggregate({
      where: { projectId },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    })

    // Log activity
    await logActivity({
      action: 'create',
      category: 'task',
      title: `Created task "${title}"`,
      metadata: { taskId: task.id, projectId },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
