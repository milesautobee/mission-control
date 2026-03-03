import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// GET /api/docs/[id] - get one document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const doc = await prisma.document.findUnique({
      where: { id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

// PATCH /api/docs/[id] - update one document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Prisma.DocumentUpdateInput = {}

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 })
      }
      updateData.title = body.title.trim()
    }

    if (body.content !== undefined) {
      if (typeof body.content !== 'string' || !body.content.trim()) {
        return NextResponse.json(
          { error: 'content must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.content = body.content
    }

    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || !body.category.trim()) {
        return NextResponse.json(
          { error: 'category must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.category = body.category.trim().toLowerCase()
    }

    if (body.format !== undefined) {
      if (typeof body.format !== 'string' || !body.format.trim()) {
        return NextResponse.json({ error: 'format must be a non-empty string' }, { status: 400 })
      }
      updateData.format = body.format.trim().toLowerCase()
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: 'tags must be a string array' }, { status: 400 })
      }

      updateData.tags = body.tags
        .filter((tag: unknown): tag is string => typeof tag === 'string')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields were provided for update' },
        { status: 400 }
      )
    }

    const existingDoc = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = await prisma.document.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

// DELETE /api/docs/[id] - delete one document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingDoc = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await prisma.document.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
