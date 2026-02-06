import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseLimit(raw: string | null) {
  if (!raw) return DEFAULT_LIMIT
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(parsed, 1), MAX_LIMIT)
}

function parseDate(raw: string | null) {
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

// GET /api/activity - List activities with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = parseLimit(searchParams.get('limit'))
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const since = parseDate(searchParams.get('since'))

    if (searchParams.get('since') && !since) {
      return NextResponse.json({ error: 'Invalid since date' }, { status: 400 })
    }

    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      where: {
        ...(category ? { category } : {}),
        ...(action ? { action } : {}),
        ...(status ? { status } : {}),
        ...(since ? { timestamp: { gte: since } } : {}),
      },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// POST /api/activity - Log new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      category,
      title,
      description,
      metadata,
      sessionId,
      status,
      timestamp,
    } = body

    if (!action || !category || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: action, category, title' },
        { status: 400 }
      )
    }

    let parsedTimestamp: Date | undefined
    if (timestamp) {
      const parsed = new Date(timestamp)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 })
      }
      parsedTimestamp = parsed
    }

    const activity = await prisma.activity.create({
      data: {
        action,
        category,
        title,
        description,
        metadata,
        sessionId,
        status,
        ...(parsedTimestamp ? { timestamp: parsedTimestamp } : {}),
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
