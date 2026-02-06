import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const columnId = searchParams.get('columnId')

    const projects = await prisma.project.findMany({
      where: columnId ? { columnId } : undefined,
      orderBy: { position: 'asc' },
      include: {
        column: {
          select: { name: true },
        },
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
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
    const maxPosition = await prisma.project.aggregate({
      where: { columnId },
      _max: { position: true },
    })

    const project = await prisma.project.create({
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
      include: {
        tasks: true,
      },
    })

    // Log activity
    await logActivity({
      action: 'create',
      category: 'project',
      title: `Created project "${title}"`,
      description: description || undefined,
      metadata: { projectId: project.id, columnId, priority },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
