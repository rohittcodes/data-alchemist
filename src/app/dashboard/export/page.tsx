'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  FileText, 
  Database, 
  Settings, 
  Package,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Braces,
  Archive
} from 'lucide-react'

interface SessionData {
  sessionId: string
  clients?: any
  workers?: any
  tasks?: any
  rules?: any[]
  created: number
  lastModified: number
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

interface ExportStats {
  totalFiles: number
  totalRows: number
  totalRules: number
  dataTypes: {
    clients: number
    workers: number
    tasks: number
  }
}

function ExportPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

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
      
      // Calculate export statistics
      const stats: ExportStats = {
        totalFiles: 0,
        totalRows: 0,
        totalRules: data.rules?.length || 0,
        dataTypes: {
          clients: data.clients?.rowCount || 0,
          workers: data.workers?.rowCount || 0,
          tasks: data.tasks?.rowCount || 0
        }
      }
      
      Object.values(stats.dataTypes).forEach(count => {
        if (count > 0) {
          stats.totalFiles++
          stats.totalRows += count
        }
      })
      
      setExportStats(stats)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type: 'zip' | 'csv' | 'json', dataType?: string) => {
    if (!sessionData) return
    
    const downloadKey = `${type}-${dataType || 'all'}`
    setDownloading(downloadKey)
    
    try {
      const params = new URLSearchParams({
        sessionId: sessionData.sessionId
      })
      
      if (type !== 'zip') {
        params.append('format', type)
      }
      
      if (dataType) {
        params.append('dataType', dataType)
      }
      
      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export-${Date.now()}.${type === 'zip' ? 'zip' : type === 'json' ? 'json' : 'csv'}`
      
      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download export. Please try again.')
    } finally {
      setDownloading(null)
    }
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

  if (!sessionData || !exportStats) {
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

  const progressValue = Math.min(100, (exportStats.totalRows / 1000) * 100)

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Download className="h-8 w-8" />
              Export Data
            </h1>
            <p className="text-muted-foreground mt-1">
              Download your cleaned data and project rules
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

        {/* Export Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                Ready for export
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.totalRows.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all data types
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Project Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.totalRules}</div>
              <p className="text-xs text-muted-foreground">
                Workflow constraints
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-xs text-muted-foreground">
                Validated & clean
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complete Package Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Complete Export Package
              </CardTitle>
              <CardDescription>
                Download everything in a single ZIP file with documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Package contents:</span>
                  <span className="font-medium">{exportStats.totalFiles + 1} files</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Clean CSV files for all data types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Braces className="h-4 w-4" />
                  <span>rules.json with project constraints</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>README and metadata files</span>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => handleDownload('zip')}
                disabled={downloading === 'zip-all'}
              >
                {downloading === 'zip-all' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Package...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Download Complete Package
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual File Downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Individual Files
              </CardTitle>
              <CardDescription>
                Download specific data types or rules separately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Type Downloads */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Data Files (CSV)</h4>
                {Object.entries(exportStats.dataTypes).map(([dataType, count]) => (
                  count > 0 && (
                    <div key={dataType} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {dataType} ({count.toLocaleString()} records)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload('csv', dataType)}
                        disabled={downloading === `csv-${dataType}`}
                      >
                        {downloading === `csv-${dataType}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )
                ))}
              </div>

              {/* Rules Download */}
              {exportStats.totalRules > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Project Rules (JSON)</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      rules.json ({exportStats.totalRules} rules)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload('json', 'rules')}
                      disabled={downloading === 'json-rules'}
                    >
                      {downloading === 'json-rules' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Export Information */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Export Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-2">File Formats</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>CSV Files:</strong> UTF-8 encoded, Excel compatible</li>
                  <li>• <strong>Rules JSON:</strong> Structured project constraints</li>
                  <li>• <strong>ZIP Package:</strong> Complete export with documentation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Data Quality</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All validation errors have been addressed</li>
                  <li>• Data types are properly formatted</li>
                  <li>• Headers are standardized and clean</li>
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
export default function ExportPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading export dashboard...</span>
          </div>
        </div>
      </Layout>
    }>
      <ExportPageContent />
    </Suspense>
  )
}
