import { NextRequest, NextResponse } from 'next/server'
import { SessionManager, type SessionData } from '@/lib/storage'

interface SearchMatch {
  field: string
  value: string
  matchType: 'exact'
}

interface RowMatch {
  rowIndex: number
  row: Record<string, unknown>
  matches: SearchMatch[]
}

interface MetadataMatch {
  type: 'session_info'
  matches: Array<{ field: string; value: string }>
}

interface SessionResult {
  sessionId: string
  matches: {
    clients: RowMatch[]
    workers: RowMatch[]
    tasks: RowMatch[]
    metadata: MetadataMatch[]
  }
  totalMatches: number
  metadata: {
    created: number
    status: string
  }
}

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

    const searchResults: SessionResult[] = []
    const queryLower = query.toLowerCase()

    for (const key of sessionKeys) {
      const currentSessionId = key.replace('session:', '')
      const sessionData = await SessionManager.getSession(currentSessionId)
      
      if (!sessionData) continue

      const sessionResult: SessionResult = {
        sessionId: currentSessionId,
        matches: {
          clients: [],
          workers: [],
          tasks: [],
          metadata: []
        },
        totalMatches: 0,
        metadata: {
          created: sessionData.created,
          status: sessionData.status
        }
      }

      // Search in each data type
      for (const dataType of ['clients', 'workers', 'tasks'] as const) {
        const data = sessionData[dataType]
        if (!data || !data.rows || !Array.isArray(data.rows)) continue

        const matches: RowMatch[] = []
        
        // Search through rows
        data.rows.forEach((row: Record<string, unknown>, rowIndex: number) => {
          const rowMatches: SearchMatch[] = []
          
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
          sessionResult.matches[dataType] = matches
          sessionResult.totalMatches += matches.length
        }
      }

      // Also search in session metadata and filenames
      if (sessionData.sessionId?.toLowerCase().includes(queryLower) ||
          sessionData.clients?.fileName?.toLowerCase().includes(queryLower) ||
          sessionData.workers?.fileName?.toLowerCase().includes(queryLower) ||
          sessionData.tasks?.fileName?.toLowerCase().includes(queryLower)) {
        sessionResult.totalMatches += 1
        
        const metadataMatches: Array<{ field: string; value: string }> = []
        
        if (sessionData.sessionId?.toLowerCase().includes(queryLower)) {
          metadataMatches.push({ field: 'sessionId', value: sessionData.sessionId })
        }
        if (sessionData.clients?.fileName?.toLowerCase().includes(queryLower)) {
          metadataMatches.push({ field: 'clientsFile', value: sessionData.clients.fileName })
        }
        if (sessionData.workers?.fileName?.toLowerCase().includes(queryLower)) {
          metadataMatches.push({ field: 'workersFile', value: sessionData.workers.fileName })
        }
        if (sessionData.tasks?.fileName?.toLowerCase().includes(queryLower)) {
          metadataMatches.push({ field: 'tasksFile', value: sessionData.tasks.fileName })
        }
        
        sessionResult.matches.metadata = [{
          type: 'session_info',
          matches: metadataMatches
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
