import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/memory - list memory entries, newest first, optional search across filename/content
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''

    const memories = await prisma.memory.findMany({
      where: search
        ? {
            OR: [
              { filename: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error('Failed to fetch memory entries:', error)
    return NextResponse.json({ error: 'Failed to fetch memory entries' }, { status: 500 })
  }
}
