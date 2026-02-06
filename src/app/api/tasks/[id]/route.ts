import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update a task (toggle completed, update title, reorder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, completed, position } = body

    // Build update data object
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (completed !== undefined) updateData.completed = completed
    if (position !== undefined) updateData.position = position

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    })

    // Log activity based on what changed
    if (completed !== undefined) {
      await logActivity({
        action: completed ? 'complete' : 'uncomplete',
        category: 'task',
        title: completed ? `Completed task "${task.title}"` : `Reopened task "${task.title}"`,
        metadata: { taskId: id, completed },
      })
    } else if (title !== undefined) {
      await logActivity({
        action: 'update',
        category: 'task',
        title: `Updated task "${task.title}"`,
        metadata: { taskId: id },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get task title before deleting
    const task = await prisma.task.findUnique({ where: { id } })
    
    await prisma.task.delete({
      where: { id },
    })

    // Log activity
    await logActivity({
      action: 'delete',
      category: 'task',
      title: `Deleted task "${task?.title ?? id}"`,
      metadata: { taskId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
