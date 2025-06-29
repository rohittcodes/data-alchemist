"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { useSessions } from "@/hooks/useSessions"
import { useAnalysisSearch } from "@/hooks/useAnalysisSearch"
import { 
  SearchFilters, 
  QuickStats, 
  EmptyState, 
  SessionsList, 
  ErrorState, 
  FilteredEmptyState 
} from "@/components/analysis"

function AnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const { sessions, loading, error, refetch } = useSessions()
  const { 
    filteredSessions, 
    searchQuery, 
    statusFilter, 
    setSearchQuery, 
    setStatusFilter 
  } = useAnalysisSearch(sessions)

  // Sync search query with URL parameters
  React.useEffect(() => {
    const urlSearchQuery = searchParams.get('search') || ''
    if (urlSearchQuery !== searchQuery) {
      setSearchQuery(urlSearchQuery)
    }
  }, [searchParams, searchQuery, setSearchQuery])

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
  }, [isLoaded, user, router, searchParams])

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  const handleSessionClick = (sessionId: string) => {
    router.push(`/analysis/${sessionId}`)
  }

  const handleAnalyzeClick = (sessionId: string) => {
    router.push(`/analysis/${sessionId}`)
  }

  const handleViewClick = (sessionId: string) => {
    router.push(`/data/session?session=${sessionId}`)
  }

  const handleExportClick = (sessionId: string) => {
    router.push(`/export?session=${sessionId}`)
  }

  const handleUploadClick = () => {
    router.push('/data')
  }

  const handleDemoClick = () => {
    router.push('/data?demo=true')
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
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
        />

        {/* Quick Stats */}
        <QuickStats sessions={filteredSessions} searchQuery={searchQuery} />

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
              <ErrorState error={error} onRetry={refetch} />
            ) : sessions.length === 0 && !searchQuery && statusFilter === 'all' ? (
              <EmptyState onUploadClick={handleUploadClick} onDemoClick={handleDemoClick} />
            ) : filteredSessions.length === 0 ? (
              <FilteredEmptyState
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                onClearFilters={handleClearFilters}
                onNewAnalysis={handleUploadClick}
              />
            ) : (
              <SessionsList
                sessions={filteredSessions}
                onSessionClick={handleSessionClick}
                onAnalyzeClick={handleAnalyzeClick}
                onViewClick={handleViewClick}
                onExportClick={handleExportClick}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Data Analysis</CardTitle>
              <CardDescription>Loading your data sessions...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    }>
      <AnalysisContent />
    </Suspense>
  )
}
