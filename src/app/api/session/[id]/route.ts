import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/kv-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const sessionData = await SessionManager.getSession(sessionId)
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if full data is requested
    const url = new URL(request.url)
    const includeData = url.searchParams.get('includeData') === 'true'

    if (includeData) {
      // Return full session data including rows
      return NextResponse.json(sessionData)
    }

    // Return session info without raw data (for performance)
    const sessionInfo = {
      sessionId: sessionData.sessionId,
      status: sessionData.status,
      created: sessionData.created,
      lastModified: sessionData.lastModified,
      files: {
        clients: sessionData.clients ? {
          fileName: sessionData.clients.fileName,
          rowCount: sessionData.clients.rowCount,
          headers: sessionData.clients.headers,
          fileSize: sessionData.clients.fileSize
        } : null,
        workers: sessionData.workers ? {
          fileName: sessionData.workers.fileName,
          rowCount: sessionData.workers.rowCount,
          headers: sessionData.workers.headers,
          fileSize: sessionData.workers.fileSize
        } : null,
        tasks: sessionData.tasks ? {
          fileName: sessionData.tasks.fileName,
          rowCount: sessionData.tasks.rowCount,
          headers: sessionData.tasks.headers,
          fileSize: sessionData.tasks.fileSize
        } : null
      }
    }

    return NextResponse.json(sessionInfo)
  } catch (error) {
    console.error('Session retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    await SessionManager.deleteSession(sessionId)
    
    return NextResponse.json({
      message: 'Session deleted successfully'
    })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}