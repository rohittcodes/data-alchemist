"use client"

import { useParams, useRouter } from "next/navigation"
import { useSessionProcessing } from "@/hooks/useSessionProcessing"
import {
  SessionHeader,
  FileInfoCard,
  ProcessingSection,
  SessionInfoCard,
  LoadingState,
  SessionNotFoundState
} from "@/components/session"

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const {
    sessionData,
    loading,
    processing,
    progress,
    startProcessing
  } = useSessionProcessing(sessionId)

  const handleGoBack = () => router.push('/')

  if (loading) {
    return <LoadingState />
  }

  if (!sessionData) {
    return <SessionNotFoundState onGoBack={handleGoBack} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <SessionHeader sessionId={sessionId} onBack={handleGoBack} />
          <FileInfoCard sessionData={sessionData} />
          <ProcessingSection
            sessionData={sessionData}
            processing={processing}
            progress={progress}
            onStartProcessing={startProcessing}
          />
          <SessionInfoCard />
        </div>
      </div>
    </div>
  )
}
