"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ValidationPanel, DataTable, FixRecommendations } from "@/components/data"
import { 
  ArrowLeft, 
  Database, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  FileText,
  Users,
  Briefcase,
  CheckSquare,
  Activity,
  TrendingUp
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ValidationSummary } from "@/lib/validators/types"
import { canAutoFix } from "@/lib/validators/auto-fix"

export default function SessionAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [sessionData, setSessionData] = React.useState<any>(null)
  const [validation, setValidation] = React.useState<ValidationSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [validating, setValidating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (sessionId) {
      loadSessionData()
    }
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      
      // Load session data
      const sessionResponse = await fetch(`/api/session/${sessionId}?includeData=true`)
      if (!sessionResponse.ok) {
        throw new Error('Failed to load session data')
      }
      const session = await sessionResponse.json()
      setSessionData(session)
      
      // Run validation
      await runValidation(session)
      
    } catch (err) {
      console.error('Failed to load session:', err)
      setError(err instanceof Error ? err.message : 'Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const runValidation = async (session: any) => {
    try {
      setValidating(true)
      
      const validationResponse = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          data: {
            clients: session.clients?.rows || [],
            workers: session.workers?.rows || [],
            tasks: session.tasks?.rows || []
          }
        })
      })
      
      if (!validationResponse.ok) {
        throw new Error('Validation failed')
      }
      
      const validationResult = await validationResponse.json()
      setValidation(validationResult)
      
    } catch (err) {
      console.error('Validation error:', err)
      // Don't set error state for validation failure, just log it
    } finally {
      setValidating(false)
    }
  }

  const handleDataUpdated = () => {
    // Reload session data and re-run validation
    loadSessionData()
  }

  const getHealthScore = () => {
    if (!validation) return 0
    const { totalErrors, totalWarnings } = validation
    const totalIssues = totalErrors + totalWarnings
    return totalIssues === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10 + totalWarnings * 3))
  }

  const getManualAndBusinessErrors = () => {
    if (!validation) return { manualReview: [], businessDecisions: [] }
    
    const manualReview = validation.allErrors.filter(error => 
      !canAutoFix(error) && error.category !== 'business' && error.category !== 'skill'
    )
    
    const businessDecisions = validation.allErrors.filter(error => 
      error.category === 'business' || error.category === 'skill'
    )
    
    return { manualReview, businessDecisions }
  }

  const dataTypes = [
    { key: 'clients', label: 'Clients', icon: Users, color: 'blue' },
    { key: 'workers', label: 'Workers', icon: Briefcase, color: 'green' },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'purple' }
  ]

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400">Loading session analysis...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push('/analysis')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </Button>
          </div>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Session</h3>
              <p className="text-gray-400 mb-6 max-w-md">{error}</p>
              <Button onClick={() => router.push('/analysis')}>
                Back to Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const availableDataTypes = dataTypes.filter(type => {
    const data = sessionData?.[type.key]
    const dataArray = data?.rows || data?.data || data
    return Array.isArray(dataArray) && dataArray.length > 0
  })

  const healthScore = getHealthScore()

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push('/analysis')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Session Analysis
              </h1>
              <p className="text-gray-400 mt-1">
                Session ID: {sessionId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => loadSessionData()}
              variant="outline"
              size="sm"
              disabled={loading || validating}
            >
              <Activity className="w-4 h-4 mr-2" />
              {validating ? 'Re-analyzing...' : 'Re-analyze'}
            </Button>
            <Button
              onClick={() => router.push(`/data/session?session=${sessionId}`)}
              variant="outline"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Data
            </Button>
            <Button
              onClick={() => router.push(`/rules?session=${sessionId}`)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Rules
            </Button>
          </div>
        </div>

        {/* Health Score & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  healthScore >= 90 ? 'bg-green-500/20' :
                  healthScore >= 70 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    healthScore >= 90 ? 'text-green-400' :
                    healthScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{healthScore}%</div>
                  <div className="text-sm text-gray-400">Health Score</div>
                  {!validation && (
                    <div className="text-xs text-yellow-400 mt-1">
                      Click "Re-analyze" to generate score
                    </div>
                  )}
                  {validation && (
                    <div className="text-xs text-gray-500 mt-1">
                      {validation.totalErrors} errors, {validation.totalWarnings} warnings
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {availableDataTypes.map((type) => {
            const data = sessionData?.[type.key]
            const dataArray = data?.rows || data?.data || data
            const count = Array.isArray(dataArray) ? dataArray.length : 0

            return (
              <Card key={type.key} className="bg-white/5 backdrop-blur-xl border border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${type.color}-500/20`}>
                      <type.icon className={`w-6 h-6 text-${type.color}-400`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{count}</div>
                      <div className="text-sm text-gray-400">{type.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Validation Results */}
        {validating ? (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Activity className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-gray-400">Running AI validation analysis...</p>
              </div>
            </CardContent>
          </Card>
        ) : validation ? (
          <>
            <ValidationPanel
              validation={validation}
              sessionId={sessionId}
              onDataUpdated={handleDataUpdated}
            />
            
            {/* Actionable Recommendations for Manual/Business Issues */}
            {(() => {
              const { manualReview, businessDecisions } = getManualAndBusinessErrors()
              return (manualReview.length > 0 || businessDecisions.length > 0) ? (
                <FixRecommendations
                  manualReviewErrors={manualReview}
                  businessDecisionErrors={businessDecisions}
                  sessionId={sessionId}
                />
              ) : null
            })()}
          </>
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Validation Unavailable</h3>
              <p className="text-gray-400 mb-6">Unable to run validation analysis on this session.</p>
              <Button onClick={loadSessionData} variant="outline">
                Retry Validation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Data Tables */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={availableDataTypes[0]?.key} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {dataTypes.map((type) => {
                  const isAvailable = availableDataTypes.some(t => t.key === type.key)
                  const data = sessionData?.[type.key]
                  const dataArray = data?.rows || data?.data || data
                  const count = Array.isArray(dataArray) ? dataArray.length : 0

                  return (
                    <TabsTrigger 
                      key={type.key} 
                      value={type.key}
                      disabled={!isAvailable}
                      className="flex items-center gap-2"
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                      {isAvailable && (
                        <span className="ml-1 text-xs bg-white/20 px-1 rounded">
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {availableDataTypes.map((type) => {
                const data = sessionData?.[type.key]
                const dataArray = data?.rows || data?.data || data

                return (
                  <TabsContent key={type.key} value={type.key} className="mt-6">
                    {Array.isArray(dataArray) && dataArray.length > 0 ? (
                      <DataTable 
                        data={dataArray.slice(0, 10)} // Show only first 10 rows for preview
                        onCellEdit={async () => {}} // Read-only in analysis view
                        readOnly={true}
                        className="bg-transparent"
                      />
                    ) : (
                      <div className="text-center py-16">
                        <type.icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No {type.label} Data</h3>
                        <p className="text-gray-400">No {type.label.toLowerCase()} data found in this session.</p>
                      </div>
                    )}
                    {Array.isArray(dataArray) && dataArray.length > 10 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-400 mb-2">
                          Showing 10 of {dataArray.length} records
                        </p>
                        <Button
                          onClick={() => router.push(`/data/session?session=${sessionId}`)}
                          variant="outline"
                          size="sm"
                        >
                          View All Data
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
