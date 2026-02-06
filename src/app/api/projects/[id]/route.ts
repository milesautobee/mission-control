import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        column: {
          select: { name: true },
        },
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { columnId, title, description, assignee, priority, dueDate, position, labels } = body

    // Get current project state for change detection
    const oldProject = await prisma.project.findUnique({
      where: { id },
      include: { column: { select: { name: true } } },
    })

    // Build update data object
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assignee !== undefined) updateData.assignee = assignee
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (labels !== undefined) updateData.labels = labels
    if (position !== undefined) updateData.position = position
    if (columnId !== undefined) updateData.columnId = columnId

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        column: { select: { name: true } },
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
    })

    // Log activity based on what changed
    if (columnId !== undefined && oldProject && oldProject.columnId !== columnId) {
      // Project moved between columns
      await logActivity({
        action: 'move',
        category: 'project',
        title: `Moved "${project.title}" to ${project.column.name}`,
        description: `From ${oldProject.column.name} to ${project.column.name}`,
        metadata: { projectId: id, fromColumn: oldProject.columnId, toColumn: columnId },
      })
    } else if (Object.keys(updateData).length > 0) {
      // General update
      await logActivity({
        action: 'update',
        category: 'project',
        title: `Updated "${project.title}"`,
        metadata: { projectId: id, fields: Object.keys(updateData) },
      })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get project title before deleting
    const project = await prisma.project.findUnique({ where: { id } })
    
    await prisma.project.delete({
      where: { id },
    })

    // Log activity
    await logActivity({
      action: 'delete',
      category: 'project',
      title: `Deleted project "${project?.title ?? id}"`,
      metadata: { projectId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
