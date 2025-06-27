'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data'
import { ValidationPanel } from '@/components/data'
import { AISearch } from '@/components/data'
import { Layout } from '@/components/layout'
import { Database, Users, Briefcase, UserCheck, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { validateData, getErrorsForDataType, ValidationError as CoreValidationError, ValidationSummary, SessionData, DataRow, SearchResults } from '@/lib'

interface ValidationError {
  row: number
  column: string
  message: string
}

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function DataPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('clients')
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({
    totalErrors: 0,
    totalWarnings: 0,
    errorsByCategory: {},
    criticalIssues: [],
    allErrors: []
  })
  const [validationErrors, setValidationErrors] = useState<{
    clients: ValidationError[]
    workers: ValidationError[]
    tasks: ValidationError[]
  }>({
    clients: [],
    workers: [],
    tasks: []
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [filteredData, setFilteredData] = useState<{
    clients?: DataRow[]
    workers?: DataRow[]
    tasks?: DataRow[]
  } | null>(null)
  const [searchActive, setSearchActive] = useState(false)

  // Fetch session data
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    fetchSessionData()
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/session/${sessionId}?includeData=true`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Session ${sessionId} not found. Please upload files again.`)
        }
        throw new Error('Failed to fetch session data')
      }
      
      const data = await response.json()
      setSessionData(data)
      
      // Run validation
      runValidation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Comprehensive validation using the new engine
  const runValidation = (data: SessionData) => {
    const validationResult = validateData(data.clients, data.workers, data.tasks)
    setValidationSummary(validationResult)
    
    // Convert to DataTable format
    setValidationErrors({
      clients: getErrorsForDataType(validationResult.allErrors, 'clients'),
      workers: getErrorsForDataType(validationResult.allErrors, 'workers'),
      tasks: getErrorsForDataType(validationResult.allErrors, 'tasks')
    })
  }

  // Handle jumping to specific validation errors
  const handleJumpToError = useCallback((error: CoreValidationError) => {
    // Switch to the appropriate tab
    setActiveTab(error.dataType)
    
    // Scroll to the error (in a real implementation, you might want to highlight the specific cell)
    setTimeout(() => {
      const tableElement = document.querySelector(`[data-testid="${error.dataType}-table"]`)
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }, [])

  // Manual re-validation trigger
  const handleRevalidate = useCallback(() => {
    if (sessionData) {
      runValidation(sessionData)
    }
  }, [sessionData])

  // Handle cell edits with auto-save and real-time validation
  const handleCellEdit = useCallback(async (
    dataType: 'clients' | 'workers' | 'tasks',
    rowIndex: number,
    columnId: string,
    value: string
  ) => {
    if (!sessionData || !sessionData[dataType]) return

    try {
      setSaveStatus('saving')

      // Update local state immediately for responsive UI
      const updatedData = { ...sessionData }
      if (updatedData[dataType]?.rows[rowIndex]) {
        updatedData[dataType]!.rows[rowIndex][columnId] = value
      }
      setSessionData(updatedData)

      // Save to backend
      const response = await fetch(`/api/session/${sessionId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: dataType,
          rowIndex,
          columnId,
          value
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      setSaveStatus('saved')
      
      // Re-run validation after edit with updated data
      runValidation(updatedData)

      // Reset save status after a delay
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save cell edit:', error)
      setSaveStatus('error')
      
      // Revert local changes on error
      await fetchSessionData()
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }, [sessionData, sessionId])

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading session data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !sessionData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Upload
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const totalErrors = validationSummary.totalErrors
  const totalWarnings = validationSummary.totalWarnings
  const totalIssues = totalErrors + totalWarnings

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Data Editor
            </h1>
            <p className="text-muted-foreground mt-1">
              Session: {sessionData.sessionId}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Re-validation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevalidate}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-validate
            </Button>

            {/* Save Status */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Save failed</span>
                </>
              )}
            </div>

            {/* Validation Status */}
            {totalIssues > 0 ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalErrors > 0 ? `${totalErrors} error${totalErrors > 1 ? 's' : ''}` : `${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`}
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Summary Panel */}
        <ValidationPanel 
          validation={validationSummary}
          sessionId={sessionData.sessionId}
          onJumpToError={handleJumpToError}
          onDataUpdated={fetchSessionData}
          className="mb-8"
        />

        {/* AI-Powered Search */}
        <AISearch 
          sessionId={sessionData.sessionId}
          onResults={(results: SearchResults | null) => {
            if (results && results.filteredData) {
              setFilteredData(results.filteredData)
              setSearchActive(true)
              
              // If results specify a specific data type, switch to that tab
              if (results.filter && results.filter.dataType) {
                setActiveTab(results.filter.dataType)
              }
            } else {
              // Clear search results
              setFilteredData(null)
              setSearchActive(false)
            }
          }}
          className="mb-8"
        />

        {/* Search Results Info */}
        {searchActive && filteredData && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Search Active
                  </Badge>
                  <span className="text-sm">
                    Showing filtered results
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setFilteredData(null)
                    setSearchActive(false)
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Three-Tab Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
              {sessionData.clients && (
                <Badge variant="secondary" className="ml-1">
                  {searchActive && filteredData?.clients 
                    ? `${filteredData.clients.length} / ${sessionData.clients.rowCount}`
                    : sessionData.clients.rowCount
                  }
                </Badge>
              )}
              {validationErrors.clients.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {validationErrors.clients.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Workers
              {sessionData.workers && (
                <Badge variant="secondary" className="ml-1">
                  {searchActive && filteredData?.workers
                    ? `${filteredData.workers.length} / ${sessionData.workers.rowCount}`
                    : sessionData.workers.rowCount
                  }
                </Badge>
              )}
              {validationErrors.workers.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {validationErrors.workers.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Tasks
              {sessionData.tasks && (
                <Badge variant="secondary" className="ml-1">
                  {searchActive && filteredData?.tasks
                    ? `${filteredData.tasks.length} / ${sessionData.tasks.rowCount}`
                    : sessionData.tasks.rowCount
                  }
                </Badge>
              )}
              {validationErrors.tasks.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {validationErrors.tasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Clients Data</CardTitle>
                <CardDescription>
                  {sessionData.clients 
                    ? searchActive && filteredData?.clients
                      ? `Showing ${filteredData.clients.length} of ${sessionData.clients.rowCount} clients`
                      : `${sessionData.clients.rowCount} clients loaded`
                    : 'No clients data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.clients ? (
                  <div data-testid="clients-table">
                    <DataTable
                      data={searchActive && filteredData?.clients ? filteredData.clients : sessionData.clients.rows}
                      onCellEdit={(rowIndex, columnId, value) => 
                        handleCellEdit('clients', rowIndex, columnId, value)
                      }
                      validationErrors={validationErrors.clients}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No clients data uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workers Tab */}
          <TabsContent value="workers">
            <Card>
              <CardHeader>
                <CardTitle>Workers Data</CardTitle>
                <CardDescription>
                  {sessionData.workers 
                    ? searchActive && filteredData?.workers
                      ? `Showing ${filteredData.workers.length} of ${sessionData.workers.rowCount} workers`
                      : `${sessionData.workers.rowCount} workers loaded`
                    : 'No workers data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.workers ? (
                  <div data-testid="workers-table">
                    <DataTable
                      data={searchActive && filteredData?.workers ? filteredData.workers : sessionData.workers.rows}
                      onCellEdit={(rowIndex, columnId, value) => 
                        handleCellEdit('workers', rowIndex, columnId, value)
                      }
                      validationErrors={validationErrors.workers}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No workers data uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks Data</CardTitle>
                <CardDescription>
                  {sessionData.tasks 
                    ? searchActive && filteredData?.tasks
                      ? `Showing ${filteredData.tasks.length} of ${sessionData.tasks.rowCount} tasks`
                      : `${sessionData.tasks.rowCount} tasks loaded`
                    : 'No tasks data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.tasks ? (
                  <div data-testid="tasks-table">
                    <DataTable
                      data={searchActive && filteredData?.tasks ? filteredData.tasks : sessionData.tasks.rows}
                      onCellEdit={(rowIndex, columnId, value) => 
                        handleCellEdit('tasks', rowIndex, columnId, value)
                      }
                      validationErrors={validationErrors.tasks}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks data uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

// Main page component with Suspense boundary
export default function DataPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </Layout>
    }>
      <DataPageContent />
    </Suspense>
  )
}
