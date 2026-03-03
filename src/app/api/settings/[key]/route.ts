import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings/[key] - Get setting by key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    const setting = await prisma.setting.findUnique({
      where: { key },
    })

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Failed to fetch setting:', error)
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 })
  }
}

// PUT /api/settings/[key] - Upsert setting by key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const body = await request.json()
    const { value } = body

    if (typeof value !== 'string') {
      return NextResponse.json({ error: 'value must be a string' }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Failed to update setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
