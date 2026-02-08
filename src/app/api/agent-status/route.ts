import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// We'll use a simple key-value approach in the database
// Store agent status as a special "system" record

// GET /api/agent-status - Check if Miles is currently active
export async function GET() {
  try {
    // Look for agent status record (stored as a project in a hidden system column)
    // We'll use a simpler approach: check the activities table or use raw query
    const result = await prisma.$queryRaw<Array<{status: string, updated_at: Date}>>`
      SELECT status, updated_at FROM agent_status WHERE id = 'miles' LIMIT 1
    `.catch(() => null)

    if (!result || result.length === 0) {
      return NextResponse.json({
        active: false,
        sessions: [],
        lastSeen: null,
      })
    }

    const record = result[0]
    const data = JSON.parse(record.status)
    const lastSeen = record.updated_at

    // Consider active if updated within last 2 minutes
    const isRecent = (Date.now() - new Date(lastSeen).getTime()) < 120000

    return NextResponse.json({
      active: isRecent && data.active,
      sessions: isRecent ? (data.sessions || []) : [],
      sessionCount: isRecent ? (data.sessions?.length || 0) : 0,
      lastSeen: lastSeen,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to check agent status:', error)
    return NextResponse.json({
      active: false,
      sessions: [],
      error: 'Status check failed',
    })
  }
}

// POST /api/agent-status - Update Miles' status (called by the agent)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { active, sessions } = body

    const status = JSON.stringify({ active, sessions: sessions || [] })

    // Upsert the status
    await prisma.$executeRaw`
      INSERT INTO agent_status (id, status, updated_at)
      VALUES ('miles', ${status}::text, NOW())
      ON CONFLICT (id) DO UPDATE SET status = ${status}::text, updated_at = NOW()
    `

    return NextResponse.json({ ok: true })
  } catch {
    // Table might not exist yet, create it
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS agent_status (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL DEFAULT '{}',
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      // Retry the insert
      const body = await request.clone().json().catch(() => ({ active: false, sessions: [] }))
      const status = JSON.stringify({ active: body.active, sessions: body.sessions || [] })
      await prisma.$executeRaw`
        INSERT INTO agent_status (id, status, updated_at)
        VALUES ('miles', ${status}::text, NOW())
        ON CONFLICT (id) DO UPDATE SET status = ${status}::text, updated_at = NOW()
      `
      return NextResponse.json({ ok: true, created_table: true })
    } catch (innerError) {
      console.error('Failed to update agent status:', innerError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
  }
}
