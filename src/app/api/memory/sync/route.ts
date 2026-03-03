import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SyncPayload = {
  filename?: string
  content?: string
  date?: string
  type?: string
}

// POST /api/memory/sync - upsert memory by filename
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncPayload
    const filename = body.filename?.trim()
    const content = body.content
    const type = body.type?.trim() || 'daily'

    if (!filename || typeof content !== 'string' || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, content, date' },
        { status: 400 }
      )
    }

    const parsedDate = new Date(body.date)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const existing = await prisma.memory.findFirst({
      where: { filename },
      orderBy: { updatedAt: 'desc' },
    })

    if (existing) {
      const updated = await prisma.memory.update({
        where: { id: existing.id },
        data: {
          content,
          date: parsedDate,
          type,
        },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.memory.create({
      data: {
        filename,
        content,
        date: parsedDate,
        type,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Failed to sync memory entry:', error)
    return NextResponse.json({ error: 'Failed to sync memory entry' }, { status: 500 })
  }
}
