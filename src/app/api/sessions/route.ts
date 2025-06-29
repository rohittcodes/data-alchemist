import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    console.log('Sessions API GET called - listing all sessions')
    
    // Get all session keys and fetch their data
    const sessionKeys = await SessionManager.listSessions()
    console.log('Session keys retrieved:', sessionKeys ? sessionKeys.length : 0)
    
    const sessions = []
    if (sessionKeys && sessionKeys.length > 0) {
      for (const key of sessionKeys) {
        // Extract session ID from key (remove 'session:' prefix)
        const sessionId = key.replace('session:', '')
        const sessionData = await SessionManager.getSession(sessionId)
        if (sessionData) {
          // Transform the session data to match frontend expectations
          const transformedSession = {
            sessionId: sessionData.sessionId,
            status: sessionData.status,
            created: sessionData.created,
            lastModified: sessionData.lastModified,
            files: {
              clients: sessionData.clients ? {
                fileName: sessionData.clients.fileName || 'clients.csv',
                rowCount: sessionData.clients.rowCount || 0,
                headers: sessionData.clients.headers || [],
                fileSize: sessionData.clients.fileSize || 0
              } : null,
              workers: sessionData.workers ? {
                fileName: sessionData.workers.fileName || 'workers.csv',
                rowCount: sessionData.workers.rowCount || 0,
                headers: sessionData.workers.headers || [],
                fileSize: sessionData.workers.fileSize || 0
              } : null,
              tasks: sessionData.tasks ? {
                fileName: sessionData.tasks.fileName || 'tasks.csv',
                rowCount: sessionData.tasks.rowCount || 0,
                headers: sessionData.tasks.headers || [],
                fileSize: sessionData.tasks.fileSize || 0
              } : null
            }
          }
          sessions.push(transformedSession)
        }
      }
    }
    
    console.log('Transformed sessions retrieved:', sessions.length)
    
    return NextResponse.json({
      sessions: sessions,
      total: sessions.length
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch sessions',
        sessions: [],
        total: 0
      },
      { status: 500 }
    )
  }
}
