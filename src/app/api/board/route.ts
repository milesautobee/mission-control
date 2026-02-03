import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/board - Get the board with all columns, projects, and tasks
export async function GET() {
  try {
    let board = await prisma.board.findFirst({
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            projects: {
              orderBy: { position: 'asc' },
              include: {
                tasks: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    // If no board exists, create one with default columns
    if (!board) {
      board = await prisma.board.create({
        data: {
          name: 'Mission Control',
          columns: {
            create: [
              { name: 'Backlog', position: 0, color: '#6b7280' },
              { name: 'To Do', position: 1, color: '#6130ba' },
              { name: 'In Progress', position: 2, color: '#fd4987' },
              { name: 'Done', position: 3, color: '#22c55e' },
            ],
          },
        },
        include: {
          columns: {
            orderBy: { position: 'asc' },
            include: {
              projects: {
                orderBy: { position: 'asc' },
                include: {
                  tasks: {
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to fetch board:', error)
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 })
  }
}
