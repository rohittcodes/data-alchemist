"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data"
import { ArrowLeft, Download, FileText, AlertCircle, Users, Briefcase, CheckSquare } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"

export default function SessionDataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [sessionData, setSessionData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const dataTypes = [
    { key: 'clients', label: 'Clients', icon: Users, color: 'blue' },
    { key: 'workers', label: 'Workers', icon: Briefcase, color: 'green' },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'purple' }
  ]

  React.useEffect(() => {
    const loadData = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/session/${sessionId}?includeData=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }

        const session = await response.json()
        setSessionData(session)
      } catch (err) {
        console.error('Failed to load session data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId])

  const handleCellEdit = async (type: string, rowIndex: number, columnId: string, value: string) => {
    // Update local data
    if (sessionData && sessionData[type]) {
      const currentData = sessionData[type]
      // Handle both ParsedData format (with .rows) and direct array format
      const dataArray = currentData.rows || currentData.data || currentData
      
      if (Array.isArray(dataArray)) {
        const newData = [...dataArray]
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value }
        
        setSessionData((prev: any) => ({
          ...prev,
          [type]: currentData.rows ? { ...currentData, rows: newData } : newData
        }))
      }
    }
    
    // TODO: Save changes to session via API
    console.log('Cell edited:', { type, rowIndex, columnId, value })
  }

  const handleDownload = (type: string) => {
    if (!sessionData || !sessionData[type]) return

    const currentData = sessionData[type]
    // Handle both ParsedData format (with .rows) and direct array format
    const dataArray = currentData.rows || currentData.data || currentData
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) return

    // Convert data to CSV
    const headers = Object.keys(dataArray[0])
    const csvContent = [
      headers.join(','),
      ...dataArray.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
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
    router.push('/analysis')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400">Loading session data...</p>
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

  // Find which data types have data
  const availableDataTypes = dataTypes.filter(type => {
    const data = sessionData?.[type.key]
    if (!data) return false
    
    // Handle both ParsedData format (with .rows) and direct array format
    const dataArray = data.rows || data.data || data
    return Array.isArray(dataArray) && dataArray.length > 0
  })

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
                Session Data
              </h1>
              <p className="text-gray-400 mt-1">
                Session ID: {sessionId}
              </p>
            </div>
          </div>
        </div>

        {/* Data Tabs */}
        {availableDataTypes.length > 0 ? (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={availableDataTypes[0]?.key} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {dataTypes.map((type) => {
                    const isAvailable = availableDataTypes.some(t => t.key === type.key)
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
                            {(() => {
                              const currentData = sessionData?.[type.key]
                              if (!currentData) return 0
                              // Handle both ParsedData format (with .rows) and direct array format
                              const dataArray = currentData.rows || currentData.data || currentData
                              return Array.isArray(dataArray) ? dataArray.length : 0
                            })()}
                          </span>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {availableDataTypes.map((type) => {
                  const currentData = sessionData?.[type.key]
                  // Handle both ParsedData format (with .rows) and direct array format
                  const dataArray = currentData?.rows || currentData?.data || currentData

                  return (
                    <TabsContent key={type.key} value={type.key} className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <type.icon className="w-5 h-5 text-white" />
                          <h3 className="text-lg font-semibold text-white">{type.label}</h3>
                          <span className="text-sm text-gray-400">
                            {Array.isArray(dataArray) ? dataArray.length : 0} records
                          </span>
                        </div>
                        <Button
                          onClick={() => handleDownload(type.key)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>

                      {Array.isArray(dataArray) && dataArray.length > 0 ? (
                        <DataTable 
                          data={dataArray}
                          onCellEdit={(rowIndex, columnId, value) => 
                            handleCellEdit(type.key, rowIndex, columnId, value)
                          }
                          className="bg-transparent"
                        />
                      ) : (
                        <div className="text-center py-16">
                          <type.icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">No {type.label} Data</h3>
                          <p className="text-gray-400">No {type.label.toLowerCase()} data found in this session.</p>
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
              <p className="text-gray-400 mb-6">This session doesn't contain any data to display.</p>
              <Button onClick={handleGoBack}>
                Go Back to Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
