'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useSessions } from '@/hooks/useSessions'
import { SessionSelector } from '@/components/data'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Database,
  Package,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Braces,
  Archive
} from 'lucide-react'

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
  const router = useRouter()
  
  const { sessionData, sessions, loading, error, refetch, isLoaded } = useSessions({ sessionId })
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Calculate export stats when session data changes
  React.useEffect(() => {
    if (sessionData) {
      const stats: ExportStats = {
        totalFiles: 0,
        totalRows: 0,
        totalRules: 0,
        dataTypes: {
          clients: sessionData.clients?.rowCount || 0,
          workers: sessionData.workers?.rowCount || 0,
          tasks: sessionData.tasks?.rowCount || 0
        }
      }
      
      if (sessionData.clients) {
        stats.totalFiles++
        stats.totalRows += sessionData.clients.rowCount
      }
      if (sessionData.workers) {
        stats.totalFiles++
        stats.totalRows += sessionData.workers.rowCount
      }
      if (sessionData.tasks) {
        stats.totalFiles++
        stats.totalRows += sessionData.tasks.rowCount
      }
      
      setExportStats(stats)
    }
  }, [sessionData])

  const handleExport = async (format: string) => {
    if (!sessionId) return
    
    try {
      setDownloading(format)
      
      console.log('Starting export for:', { sessionId, format })
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          format,
          includeValidation: true
        })
      })
      
      console.log('Export response status:', response.status)
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Export failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
          console.error('Export error details:', errorData)
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      console.log('Export successful, creating blob...')
      const blob = await response.blob()
      console.log('Blob created, size:', blob.size)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `data-export-${sessionId.slice(0, 8)}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('Download triggered successfully')
    } catch (err) {
      console.error('Export error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to export data: ${errorMessage}`)
    } finally {
      setDownloading(null)
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
        <Card className="bg-red-500/10 border-red-500/30">
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Upload New Data
              </Button>
              <Button 
                onClick={refetch}
                variant="outline"
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
              Export Data
            </h1>
            <p className="text-gray-400 mt-2">
              Download your processed data in various formats
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
            onSessionSelect={(sessionId) => router.push(`/export?session=${sessionId}`)}
            title="Select a Session to Export"
            description="Choose from your uploaded data sessions to export processed data"
            icon={Package}
            actionLabel="Export"
            emptyTitle="No Data Sessions Found"
            emptyDescription="Upload your first dataset to start exporting data"
          />
        ) : (
          <>
            {/* Export Stats */}
            {exportStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{exportStats.totalFiles}</div>
                    <div className="flex items-center gap-1 text-sm text-blue-400 mt-1">
                      <FileText className="w-3 h-3" />
                      <span>Ready for export</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{exportStats.totalRows.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
                      <Database className="w-3 h-3" />
                      <span>Data points</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400">Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{exportStats.dataTypes.clients}</div>
                    <div className="flex items-center gap-1 text-sm text-purple-400 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Records</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400">Workers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{exportStats.dataTypes.workers}</div>
                    <div className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Records</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-400" />
                    Excel Format
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Export as Excel spreadsheet with multiple sheets for each data type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExport('excel')}
                    disabled={downloading === 'excel'}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {downloading === 'excel' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Excel
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Braces className="w-5 h-5 text-blue-400" />
                    JSON Format
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Export as JSON with validation results and metadata included within the file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExport('json')}
                    disabled={downloading === 'json'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {downloading === 'json' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download JSON
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Archive className="w-5 h-5 text-purple-400" />
                    Complete Package
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Download everything including original files, processed data, and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExport('zip')}
                    disabled={downloading === 'zip'}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {downloading === 'zip' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Package
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Session Details */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Session Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Information about your current data session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessionData?.clients && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Clients Data</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>Rows: {sessionData.clients.rowCount}</div>
                        <div>Columns: {sessionData.clients.headers?.length || 0}</div>
                        <div>File: {sessionData.clients.fileName}</div>
                      </div>
                    </div>
                  )}
                  
                  {sessionData?.workers && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">Workers Data</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>Rows: {sessionData.workers.rowCount}</div>
                        <div>Columns: {sessionData.workers.headers?.length || 0}</div>
                        <div>File: {sessionData.workers.fileName}</div>
                      </div>
                    </div>
                  )}
                  
                  {sessionData?.tasks && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Tasks Data</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>Rows: {sessionData.tasks.rowCount}</div>
                        <div>Columns: {sessionData.tasks.headers?.length || 0}</div>
                        <div>File: {sessionData.tasks.fileName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default function ExportPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    }>
      <ExportPageContent />
    </Suspense>
  )
}
