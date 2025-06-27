'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/global/DataTable'
import { Layout } from '@/components/global/Layout'
import { Database, Users, Briefcase, UserCheck, AlertTriangle, CheckCircle, Save } from 'lucide-react'
import { ParsedData } from '@/lib/parsers'

interface SessionData {
  sessionId: string
  clients?: ParsedData
  workers?: ParsedData
  tasks?: ParsedData
  created: number
  lastModified: number
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

interface ValidationError {
  row: number
  column: string
  message: string
}

export default function DataPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('clients')
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

  // Simple validation logic
  const runValidation = (data: SessionData) => {
    const errors: typeof validationErrors = {
      clients: [],
      workers: [],
      tasks: []
    }

    // Validate clients
    if (data.clients?.rows) {
      data.clients.rows.forEach((row, index) => {
        if (!row.ClientID || row.ClientID.trim() === '') {
          errors.clients.push({
            row: index,
            column: 'ClientID',
            message: 'Client ID is required'
          })
        }
        if (!row.ClientName || row.ClientName.trim() === '') {
          errors.clients.push({
            row: index,
            column: 'ClientName',
            message: 'Client name is required'
          })
        }
      })
    }

    // Validate workers
    if (data.workers?.rows) {
      data.workers.rows.forEach((row, index) => {
        if (!row.WorkerID || row.WorkerID.trim() === '') {
          errors.workers.push({
            row: index,
            column: 'WorkerID',
            message: 'Worker ID is required'
          })
        }
        if (!row.Name || row.Name.trim() === '') {
          errors.workers.push({
            row: index,
            column: 'Name',
            message: 'Worker name is required'
          })
        }
        if (row.Rate && isNaN(Number(row.Rate))) {
          errors.workers.push({
            row: index,
            column: 'Rate',
            message: 'Rate must be a number'
          })
        }
      })
    }

    // Validate tasks
    if (data.tasks?.rows) {
      data.tasks.rows.forEach((row, index) => {
        if (!row.TaskID || row.TaskID.trim() === '') {
          errors.tasks.push({
            row: index,
            column: 'TaskID',
            message: 'Task ID is required'
          })
        }
        if (!row.ClientID || row.ClientID.trim() === '') {
          errors.tasks.push({
            row: index,
            column: 'ClientID',
            message: 'Client ID is required'
          })
        }
        if (row.Duration && isNaN(Number(row.Duration))) {
          errors.tasks.push({
            row: index,
            column: 'Duration',
            message: 'Duration must be a number'
          })
        }
      })
    }

    setValidationErrors(errors)
  }

  // Handle cell edits with auto-save
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
      
      // Re-run validation after edit
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

  const totalErrors = validationErrors.clients.length + validationErrors.workers.length + validationErrors.tasks.length

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
            {totalErrors > 0 ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {totalErrors} error{totalErrors > 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            )}
          </div>
        </div>

        {/* Three-Tab Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
              {sessionData.clients && (
                <Badge variant="secondary" className="ml-1">
                  {sessionData.clients.rowCount}
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
                  {sessionData.workers.rowCount}
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
                  {sessionData.tasks.rowCount}
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
                    ? `${sessionData.clients.rowCount} clients loaded`
                    : 'No clients data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.clients ? (
                  <DataTable
                    data={sessionData.clients.rows}
                    onCellEdit={(rowIndex, columnId, value) => 
                      handleCellEdit('clients', rowIndex, columnId, value)
                    }
                    validationErrors={validationErrors.clients}
                  />
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
                    ? `${sessionData.workers.rowCount} workers loaded`
                    : 'No workers data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.workers ? (
                  <DataTable
                    data={sessionData.workers.rows}
                    onCellEdit={(rowIndex, columnId, value) => 
                      handleCellEdit('workers', rowIndex, columnId, value)
                    }
                    validationErrors={validationErrors.workers}
                  />
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
                    ? `${sessionData.tasks.rowCount} tasks loaded`
                    : 'No tasks data available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.tasks ? (
                  <DataTable
                    data={sessionData.tasks.rows}
                    onCellEdit={(rowIndex, columnId, value) => 
                      handleCellEdit('tasks', rowIndex, columnId, value)
                    }
                    validationErrors={validationErrors.tasks}
                  />
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
