"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  ArrowLeft, 
  Database,
  Eye,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  FileText,
  Search,
  Filter
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { CardSpotlight } from "@/components/ui/animated/spotlight-card"

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

export default function AnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [filteredSessions, setFilteredSessions] = React.useState<SessionInfo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  // Sync search query with URL parameters
  React.useEffect(() => {
    const urlSearchQuery = searchParams.get('search') || ''
    if (urlSearchQuery !== searchQuery) {
      setSearchQuery(urlSearchQuery)
    }
  }, [searchParams])

  // Update URL when search query changes (with debounce)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentUrl = new URL(window.location.href)
      if (searchQuery) {
        currentUrl.searchParams.set('search', searchQuery)
      } else {
        currentUrl.searchParams.delete('search')
      }
      
      // Only update if the URL actually changed
      if (currentUrl.search !== window.location.search) {
        router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router])

  React.useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
      return
    }
    
    // Check if there's a specific session to analyze
    const sessionParam = searchParams.get('session')
    if (sessionParam) {
      router.push(`/analysis/${sessionParam}`)
      return
    }
    
    fetchSessions()
  }, [isLoaded, user, router])

  React.useEffect(() => {
    // Filter sessions based on search query and status
    let filtered = sessions

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      // First, do local filtering for quick results
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

      // For content-based search, we'll enhance this with API search results
      // This provides immediate feedback while also supporting deep content search
      performContentSearch(query)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    setFilteredSessions(filtered)
  }, [sessions, searchQuery, statusFilter])

  const performContentSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const searchResults = await response.json()
        console.log('Content search results:', searchResults)
        
        // Update filtered sessions to include content-based matches
        if (searchResults.results && searchResults.results.length > 0) {
          const contentMatchSessions = searchResults.results.map((result: any) => {
            // Find the original session and enhance it with search match info
            const originalSession = sessions.find(s => s.sessionId === result.sessionId)
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
          
          setFilteredSessions([...contentMatchSessions, ...localFiltered])
        }
      }
    } catch (error) {
      console.error('Content search failed:', error)
      // Keep local filtering results if API search fails
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Activity className="w-4 h-4 animate-spin" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  if (!isLoaded || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Analysis Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor and analyze your data processing sessions
            </p>
          </div>
          <Button 
            onClick={() => router.push('/data')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search sessions by ID or filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <CardSpotlight className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{filteredSessions.length}</div>
                <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{searchQuery ? 'Filtered' : 'All time'}</span>
                </div>
              </CardContent>
            </CardSpotlight>
          </div>

          <div>
            <CardSpotlight className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {filteredSessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Success rate</span>
                </div>
              </CardContent>
            </CardSpotlight>
          </div>

          <div>
            <CardSpotlight className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {filteredSessions.filter(s => s.status === 'processing').length}
                </div>
                <div className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
                  <Activity className="w-3 h-3" />
                  <span>In progress</span>
                </div>
              </CardContent>
            </CardSpotlight>
          </div>

          <div>
            <CardSpotlight className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {filteredSessions.reduce((total, session) => {
                    return total + 
                      (session.files.clients?.rowCount || 0) +
                      (session.files.workers?.rowCount || 0) +
                      (session.files.tasks?.rowCount || 0)
                  }, 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-blue-400 mt-1">
                  <Database className="w-3 h-3" />
                  <span>Total rows</span>
                </div>
              </CardContent>
            </CardSpotlight>
          </div>
        </div>

        {/* Sessions List */}
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Sessions</CardTitle>
            <CardDescription className="text-gray-400">
              Your data processing history and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error}</p>
                <Button 
                  onClick={fetchSessions}
                  variant="outline" 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : sessions.length === 0 && !searchQuery && statusFilter === 'all' ? (
              // Empty state when no sessions exist
              <div className="text-center py-12">
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Database className="w-12 h-12 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Welcome to Data Alchemist!</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Get started by uploading your first dataset. We'll help you analyze, validate, and transform your data with AI-powered insights.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => router.push('/data')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Upload Your First Dataset
                    </Button>
                    <Button 
                      onClick={() => router.push('/data?demo=true')}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Try with Sample Data
                    </Button>
                  </div>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                    <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                      <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <h4 className="text-sm font-medium text-white mb-1">AI Validation</h4>
                      <p className="text-xs text-gray-400">Intelligent error detection and correction suggestions</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                      <Settings className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <h4 className="text-sm font-medium text-white mb-1">Smart Rules</h4>
                      <p className="text-xs text-gray-400">Generate business rules from your data patterns</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                      <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <h4 className="text-sm font-medium text-white mb-1">Analytics</h4>
                      <p className="text-xs text-gray-400">Deep insights into your data quality and structure</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              // Filtered empty state
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No sessions found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery 
                    ? `No sessions match "${searchQuery}"${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}` 
                    : `No sessions with status "${statusFilter}"`
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                    }}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => router.push('/data')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    New Analysis
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/analysis/${session.sessionId}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(session.status)} flex items-center gap-1`}
                        >
                          {getStatusIcon(session.status)}
                          {session.status}
                        </Badge>
                        {(session as any).totalMatches && (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            {(session as any).totalMatches} matches
                          </Badge>
                        )}
                        <span className="text-sm text-gray-400">
                          {formatDate(session.created)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/analysis/${session.sessionId}`)
                          }}
                          className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Analyze
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/data/session?session=${session.sessionId}`)
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/export?session=${session.sessionId}`)
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {session.files.clients && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">
                            {session.files.clients.rowCount} clients
                          </span>
                        </div>
                      )}
                      {session.files.workers && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300">
                            {session.files.workers.rowCount} workers
                          </span>
                        </div>
                      )}
                      {session.files.tasks && (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-300">
                            {session.files.tasks.rowCount} tasks
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Search Match Details */}
                    {(session as any).searchMatches && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          Content matches found:
                        </div>
                        <div className="space-y-1 text-xs">
                          {Object.entries((session as any).searchMatches).map(([dataType, matches]: [string, any]) => {
                            if (!matches || !Array.isArray(matches) || matches.length === 0) return null;
                            return (
                              <div key={dataType} className="text-gray-400">
                                <span className="capitalize text-white">{dataType}:</span> {matches.length} match(es)
                                {matches.slice(0, 2).map((match: any, idx: number) => (
                                  <div key={idx} className="ml-2 text-gray-500">
                                    • Row {match.rowIndex + 1}: {match.matches?.[0]?.field} = "{match.matches?.[0]?.value?.slice(0, 30)}..."
                                  </div>
                                ))}
                                {matches.length > 2 && (
                                  <div className="ml-2 text-gray-500">• ...and {matches.length - 2} more</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
