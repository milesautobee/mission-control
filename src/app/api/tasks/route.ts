import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const columnId = searchParams.get('columnId')

    const tasks = await prisma.task.findMany({
      where: columnId ? { columnId } : undefined,
      orderBy: { position: 'asc' },
      include: {
        column: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { columnId, title, description, assignee, priority, dueDate, labels } = body

    if (!columnId || !title) {
      return NextResponse.json(
        { error: 'columnId and title are required' },
        { status: 400 }
      )
    }

    // Get the highest position in the column
    const maxPosition = await prisma.task.aggregate({
      where: { columnId },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        columnId,
        title,
        description: description || null,
        assignee: assignee || null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPosition._max.position ?? -1) + 1,
        labels: labels || [],
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
