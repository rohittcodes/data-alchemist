import { useState, useEffect } from 'react'

interface FileInfo {
  fileName: string
  rowCount: number
  headers: string[]
  fileSize: number
}

interface SessionInfo {
  sessionId: string
  status: string
  created: number
  lastModified: number
  files: {
    clients?: FileInfo | null
    workers?: FileInfo | null
    tasks?: FileInfo | null
  }
}

export function useAnalysisSearch(sessions: SessionInfo[]) {
  const [filteredSessions, setFilteredSessions] = useState<SessionInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    // Filter sessions based on search query and status
    let filtered = sessions

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      // Local filtering for quick results
      filtered = sessions.filter(session => {
        // Check session ID
        if (session.sessionId?.toLowerCase().includes(query)) {
          return true
        }
        
        // Check file names (with null safety)
        const clientsFileName = session.files?.clients?.fileName
        const workersFileName = session.files?.workers?.fileName
        const tasksFileName = session.files?.tasks?.fileName
        
        return (
          (clientsFileName && clientsFileName.toLowerCase().includes(query)) ||
          (workersFileName && workersFileName.toLowerCase().includes(query)) ||
          (tasksFileName && tasksFileName.toLowerCase().includes(query))
        )
      })

      // For content-based search, enhance with API search results
      performContentSearch(query, sessions, setFilteredSessions)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    setFilteredSessions(filtered)
  }, [sessions, searchQuery, statusFilter])

  const performContentSearch = async (
    query: string, 
    allSessions: SessionInfo[], 
    setFiltered: (sessions: SessionInfo[]) => void
  ) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const searchResults = await response.json()
        console.log('Content search results:', searchResults)
        
        // Update filtered sessions to include content-based matches
        if (searchResults.results && searchResults.results.length > 0) {
          const contentMatchSessions = searchResults.results.map((result: any) => {
            // Find the original session and enhance it with search match info
            const originalSession = allSessions.find(s => s.sessionId === result.sessionId)
            if (originalSession) {
              return {
                ...originalSession,
                searchMatches: result.matches,
                totalMatches: result.totalMatches
              }
            }
            return null
          }).filter(Boolean)
          
          // Merge with local filtered results, prioritizing content matches
          const localFiltered = filteredSessions.filter(session => 
            !contentMatchSessions.some((cms: any) => cms?.sessionId === session.sessionId)
          )
          
          setFiltered([...contentMatchSessions, ...localFiltered])
        }
      }
    } catch (error) {
      console.error('Content search failed:', error)
      // Keep local filtering results if API search fails
    }
  }

  return {
    filteredSessions,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter
  }
}
