import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const sessionId = searchParams.get('sessionId')
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    console.log('Search request:', { query, sessionId })

    // Get all sessions or specific session
    const sessionKeys = sessionId ? [`session:${sessionId}`] : await SessionManager.listSessions()
    
    if (!sessionKeys || sessionKeys.length === 0) {
      return NextResponse.json({
        results: [],
        totalMatches: 0,
        searchQuery: query
      })
    }

    const searchResults = []
    const queryLower = query.toLowerCase()

    for (const key of sessionKeys) {
      const currentSessionId = key.replace('session:', '')
      const sessionData = await SessionManager.getSession(currentSessionId)
      
      if (!sessionData) continue

      const sessionResult = {
        sessionId: currentSessionId,
        matches: {
          clients: [] as any[],
          workers: [] as any[],
          tasks: [] as any[],
          metadata: [] as any[]
        },
        totalMatches: 0,
        metadata: {
          created: sessionData.created,
          status: sessionData.status
        }
      }

      // Search in each data type
      for (const dataType of ['clients', 'workers', 'tasks']) {
        const data = (sessionData as any)[dataType]
        if (!data || !data.rows || !Array.isArray(data.rows)) continue

        const matches: any[] = []
        
        // Search through rows
        data.rows.forEach((row: any, rowIndex: number) => {
          const rowMatches: any[] = []
          
          // Search through each field in the row
          Object.entries(row).forEach(([field, value]) => {
            if (value && typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
              rowMatches.push({
                field,
                value,
                matchType: 'exact'
              })
            }
          })
          
          if (rowMatches.length > 0) {
            matches.push({
              rowIndex,
              row,
              matches: rowMatches
            })
          }
        })

        if (matches.length > 0) {
          (sessionResult.matches as any)[dataType] = matches
          sessionResult.totalMatches += matches.length
        }
      }

      // Also search in session metadata and filenames
      if (sessionData.sessionId?.toLowerCase().includes(queryLower) ||
          sessionData.clients?.fileName?.toLowerCase().includes(queryLower) ||
          sessionData.workers?.fileName?.toLowerCase().includes(queryLower) ||
          sessionData.tasks?.fileName?.toLowerCase().includes(queryLower)) {
        sessionResult.totalMatches += 1
        sessionResult.matches.metadata = [{
          type: 'session_info',
          matches: [
            sessionData.sessionId?.toLowerCase().includes(queryLower) && { field: 'sessionId', value: sessionData.sessionId },
            sessionData.clients?.fileName?.toLowerCase().includes(queryLower) && { field: 'clientsFile', value: sessionData.clients.fileName },
            sessionData.workers?.fileName?.toLowerCase().includes(queryLower) && { field: 'workersFile', value: sessionData.workers.fileName },
            sessionData.tasks?.fileName?.toLowerCase().includes(queryLower) && { field: 'tasksFile', value: sessionData.tasks.fileName }
          ].filter(Boolean)
        }]
      }

      if (sessionResult.totalMatches > 0) {
        searchResults.push(sessionResult)
      }
    }

    // Sort by total matches (most relevant first)
    searchResults.sort((a, b) => b.totalMatches - a.totalMatches)

    const totalMatches = searchResults.reduce((sum, result) => sum + result.totalMatches, 0)

    return NextResponse.json({
      results: searchResults,
      totalMatches,
      searchQuery: query,
      sessionCount: searchResults.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, sessionId, filters } = body
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // For POST, we can handle more complex search with filters
    console.log('Advanced search request:', { query, sessionId, filters })

    // Similar logic as GET but with additional filtering options
    // This can be extended for AI-powered search, advanced filters, etc.
    
    const searchParams = new URLSearchParams({ q: query })
    if (sessionId) searchParams.set('sessionId', sessionId)
    
    // Reuse GET logic for now
    const getRequest = new NextRequest(`${request.url}?${searchParams}`)
    return GET(getRequest)

  } catch (error) {
    console.error('Advanced search error:', error)
    return NextResponse.json(
      { error: 'Advanced search failed' },
      { status: 500 }
    )
  }
}
