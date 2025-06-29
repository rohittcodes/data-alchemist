'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useSessions } from '@/hooks/useSessions'
import { AppLayout } from '@/components/layout/AppLayout'
import { RuleBuilder, SessionSelector } from '@/components/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Settings, CheckCircle, AlertTriangle, Database } from 'lucide-react'
import type { SessionData } from '@/lib'

function RulesPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableTasks, setAvailableTasks] = useState<{ id: string; title: string }[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
      return
    }

    if (sessionId) {
      fetchSessionData()
    } else {
      fetchSessions()
    }
  }, [sessionId, isLoaded, user, router])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

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
            id: task.id || `task_${index}`,
            title: task.title || task.name || `Task ${index + 1}`
          }))
        )
      }
      
      if (data.workers?.rows) {
        setAvailableWorkers(
          data.workers.rows.map((worker: any, index: number) => ({
            id: worker.id || `worker_${index}`,
            name: worker.name || worker.fullName || `Worker ${index + 1}`
          }))
        )
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching session data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session data')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <AppLayout>
        <Card className="bg-white/5 backdrop-blur-xl border border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">Error</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={() => router.push('/data')}
                className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
              >
                <Database className="w-4 h-4 mr-2" />
                Upload New Data
              </Button>
              <Button 
                onClick={fetchSessionData}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
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
              Business Rules
            </h1>
            <p className="text-gray-400 mt-2">
              Create and manage validation rules for your data
            </p>
          </div>
          {sessionId && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Session: {sessionId.slice(0, 8)}...
              </Badge>
              <Button 
                onClick={() => router.push(`/data/session?session=${sessionId}`)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Database className="w-4 h-4 mr-2" />
                View Data
              </Button>
            </div>
          )}
        </div>

        {!sessionId ? (
          <SessionSelector
            sessions={sessions}
            loading={loading}
            onSessionSelect={(sessionId) => router.push(`/rules?session=${sessionId}`)}
            title="Select a Session for Rules"
            description="Choose from your uploaded data sessions to create and manage business rules"
            icon={Settings}
            actionLabel="Manage Rules"
            emptyTitle="No Data Sessions Found"
            emptyDescription="Upload your first dataset to start creating business rules"
          />
        ) : (
          <>
            {/* Session Info */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Session Data Loaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessionData?.clients && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Clients</div>
                      <div className="text-lg font-semibold text-white">
                        {sessionData.clients.rowCount} records
                      </div>
                    </div>
                  )}
                  {sessionData?.workers && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Workers</div>
                      <div className="text-lg font-semibold text-white">
                        {sessionData.workers.rowCount} records
                      </div>
                    </div>
                  )}
                  {sessionData?.tasks && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Tasks</div>
                      <div className="text-lg font-semibold text-white">
                        {sessionData.tasks.rowCount} records
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rule Builder */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Rule Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <RuleBuilder 
                  sessionId={sessionId}
                  availableTasks={availableTasks}
                  availableWorkers={availableWorkers}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default function RulesPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    }>
      <RulesPageContent />
    </Suspense>
  )
}
