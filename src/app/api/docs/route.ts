import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// GET /api/docs - list documents with optional search/category filters
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const categoryParam = request.nextUrl.searchParams.get('category')?.trim().toLowerCase() ?? ''
    const category = categoryParam && categoryParam !== 'all' ? categoryParam : null

    const where: Prisma.DocumentWhereInput = {}

    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(docs)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/docs - create a document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const content = typeof body.content === 'string' ? body.content : ''
    const category =
      typeof body.category === 'string' && body.category.trim()
        ? body.category.trim().toLowerCase()
        : 'general'
    const format =
      typeof body.format === 'string' && body.format.trim()
        ? body.format.trim().toLowerCase()
        : 'md'
    const tags =
      Array.isArray(body.tags)
        ? body.tags
            .filter((tag: unknown): tag is string => typeof tag === 'string')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0)
        : []

    if (!title || !content.trim()) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      )
    }

    const doc = await prisma.document.create({
      data: {
        title,
        content,
        category,
        format,
        tags,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
