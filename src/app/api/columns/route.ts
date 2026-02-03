import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/columns - List all columns with projects
export async function GET() {
  try {
    const columns = await prisma.column.findMany({
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
    })

    return NextResponse.json(columns)
  } catch (error) {
    console.error('Failed to fetch columns:', error)
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 })
  }
}
