import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/agents - List all agents
export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: [{ isSubagent: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      role,
      model,
      device,
      description,
      isActive,
      isSubagent,
      currentTask,
      lastSeen,
    } = body

    if (!name || !role || !model) {
      return NextResponse.json(
        { error: 'name, role, and model are required' },
        { status: 400 }
      )
    }

    let parsedLastSeen: Date | null | undefined = undefined
    if (lastSeen !== undefined) {
      if (lastSeen === null) {
        parsedLastSeen = null
      } else {
        const parsed = new Date(lastSeen)
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'Invalid lastSeen value' }, { status: 400 })
        }
        parsedLastSeen = parsed
      }
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        role,
        model,
        device: device ?? null,
        description: description ?? null,
        isActive: isActive ?? false,
        isSubagent: isSubagent ?? false,
        currentTask: currentTask ?? null,
        ...(parsedLastSeen !== undefined ? { lastSeen: parsedLastSeen } : {}),
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
