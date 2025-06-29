"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data"
import { ArrowLeft, Download, FileText, AlertCircle } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"

export default function DataViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = params.type as string
  const sessionId = searchParams.get('session')
  
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const typeNames = {
    clients: 'Clients',
    workers: 'Workers', 
    tasks: 'Tasks'
  } as const

  const typeName = typeNames[type as keyof typeof typeNames] || 'Data'

  React.useEffect(() => {
    const loadData = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/session/${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }

        const session = await response.json()
        const sessionData = session[type]
        
        if (!sessionData) {
          throw new Error(`No ${type} data found in session`)
        }

        // Handle both old and new data formats
        const dataArray = sessionData.data || sessionData
        setData(Array.isArray(dataArray) ? dataArray : [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId, type])

  const handleCellEdit = async (rowIndex: number, columnId: string, value: string) => {
    // Update local data
    const newData = [...data]
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value }
    setData(newData)
    
    // TODO: Save changes to session via API
    console.log('Cell edited:', { rowIndex, columnId, value })
  }

  const handleDownload = () => {
    if (data.length === 0) return

    // Convert data to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-data.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGoBack = () => {
    if (sessionId) {
      // Check if it's a preview session (from individual file upload)
      if (sessionId.startsWith('preview_')) {
        router.push('/data')
      } else {
        router.push(`/data/session?session=${sessionId}`)
      }
    } else {
      router.push('/data')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400">Loading {typeName.toLowerCase()} data...</p>
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
            <Button onClick={handleGoBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
              <p className="text-gray-400 mb-6 max-w-md">{error}</p>
              <Button onClick={handleGoBack}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleGoBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {typeName} Data
              </h1>
              <p className="text-gray-400 mt-1">
                {data.length} {data.length === 1 ? 'record' : 'records'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {typeName} Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <DataTable 
                data={data}
                onCellEdit={handleCellEdit}
                className="bg-transparent"
              />
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
                <p className="text-gray-400">No {typeName.toLowerCase()} data found in this session.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
