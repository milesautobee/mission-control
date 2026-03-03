import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/agents/[id] - Update agent runtime status fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive, currentTask, lastSeen } = body

    const updateData: {
      isActive?: boolean
      currentTask?: string | null
      lastSeen?: Date | null
    } = {}

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
      }
      updateData.isActive = isActive
    }

    if (currentTask !== undefined) {
      if (currentTask !== null && typeof currentTask !== 'string') {
        return NextResponse.json({ error: 'currentTask must be a string or null' }, { status: 400 })
      }
      updateData.currentTask = currentTask
    }

    if (lastSeen !== undefined) {
      if (lastSeen === null) {
        updateData.lastSeen = null
      } else {
        const parsed = new Date(lastSeen)
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'Invalid lastSeen value' }, { status: 400 })
        }
        updateData.lastSeen = parsed
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}
