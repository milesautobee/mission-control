import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type LogActivityParams = {
  action: string
  category: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
  sessionId?: string
}

/**
 * Log an activity entry. Fire-and-forget - errors are logged but don't block.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        action: params.action,
        category: params.category,
        title: params.title,
        description: params.description ?? null,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        sessionId: params.sessionId ?? null,
        status: 'success',
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging shouldn't break the main operation
  }
}
