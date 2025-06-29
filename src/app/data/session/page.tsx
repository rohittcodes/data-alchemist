"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, CheckSquare, ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { useDataSession } from "@/hooks/useDataSession"
import {
  DataSessionHeader,
  DataTabs,
  LoadingDataState,
  ErrorDataState,
  NoDataAvailableState
} from "@/components/data"

const dataTypes = [
  { key: 'clients', label: 'Clients', icon: Users, color: 'blue' },
  { key: 'workers', label: 'Workers', icon: Briefcase, color: 'green' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'purple' }
]

function SessionDataPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const {
    sessionData,
    loading,
    error,
    handleCellEdit,
    handleDownload
  } = useDataSession(sessionId)

  const handleGoBack = () => {
    router.push('/analysis')
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingDataState />
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
          <ErrorDataState onGoBack={handleGoBack} error={error} />
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
        <DataSessionHeader sessionId={sessionId} onGoBack={handleGoBack} />

        {availableDataTypes.length > 0 ? (
          <DataTabs
            sessionData={sessionData}
            dataTypes={dataTypes}
            availableDataTypes={availableDataTypes}
            onCellEdit={handleCellEdit}
            onDownload={handleDownload}
          />
        ) : (
          <NoDataAvailableState onGoBack={handleGoBack} />
        )}
      </div>
    </AppLayout>
  )
}

export default function SessionDataPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading session data...</div>
        </div>
      </AppLayout>
    }>
      <SessionDataPageContent />
    </Suspense>
  )
}
