'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout'
import { RuleBuilder } from '@/components/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Settings, CheckCircle, AlertTriangle } from 'lucide-react'
import type { SessionData } from '@/lib'

function RulesPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableTasks, setAvailableTasks] = useState<{ id: string; title: string }[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<{ id: string; name: string }[]>([])

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
      
      // Extract tasks and workers for rule building
      if (data.tasks?.rows) {
        setAvailableTasks(
          data.tasks.rows.map((task: any, index: number) => ({
            id: task.taskId || task.id || `task_${index}`,
            title: task.taskTitle || task.title || task.name || `Task ${index + 1}`
          }))
        )
      }
      
      if (data.workers?.rows) {
        setAvailableWorkers(
          data.workers.rows.map((worker: any, index: number) => ({
            id: worker.workerId || worker.id || `worker_${index}`,
            name: worker.workerName || worker.name || worker.firstName || `Worker ${index + 1}`
          }))
        )
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleRulesUpdated = () => {
    // Refresh session data when rules are updated
    fetchSessionData()
  }

  if (!sessionId) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-orange-500" />
              <p className="text-lg font-medium">No Session Selected</p>
              <p className="text-muted-foreground">Please go back and select a valid session.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading session data...
          </CardContent>
        </Card>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md border-red-200">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-medium text-red-800">Error Loading Session</p>
              <p className="text-red-600 mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  if (!sessionData) {
    return (
      <Layout>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Session Not Found</p>
              <p className="text-muted-foreground">The requested session could not be loaded.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Project Rules
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage rules for your project workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Session: {sessionData.sessionId}
            </Badge>
            <Badge 
              variant={sessionData.status === 'completed' ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {sessionData.status === 'completed' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {sessionData.status}
            </Badge>
          </div>
        </div>

        {/* Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                Tasks loaded from your data
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableWorkers.length}</div>
              <p className="text-xs text-muted-foreground">
                Workers loaded from your data
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionData.rules?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Rules currently configured
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rule Builder */}
        <RuleBuilder
          sessionId={sessionData.sessionId}
          availableTasks={availableTasks}
          availableWorkers={availableWorkers}
          onRulesUpdated={handleRulesUpdated}
        />

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Rule Building Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Co-Run Rules</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Link tasks that must execute together</li>
                  <li>• Useful for dependent workflows</li>
                  <li>• Select 2 or more tasks to create</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Load Limits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Set maximum tasks per worker</li>
                  <li>• Prevents overallocation</li>
                  <li>• Helps balance workloads</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Phase Windows</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Define time boundaries for phases</li>
                  <li>• Organize project timeline</li>
                  <li>• Set start and end dates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">AI Assistant</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Describe rules in plain English</li>
                  <li>• AI will create appropriate rule types</li>
                  <li>• Try: "Task A and B must run together"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

// Main page component with Suspense boundary
export default function RulesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading rules dashboard...</span>
          </div>
        </div>
      </Layout>
    }>
      <RulesPageContent />
    </Suspense>
  )
}
