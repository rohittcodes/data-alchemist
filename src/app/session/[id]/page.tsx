"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Download, FileText } from "lucide-react"

interface SessionData {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [sessionData, setSessionData] = React.useState<SessionData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`)
        
        if (!response.ok) {
          setLoading(false)
          return
        }
        
        const data = await response.json()
        setSessionData(data)
      } catch (error) {
        console.error('Failed to fetch session data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const startProcessing = () => {
    setProcessing(true)
    setProgress(0)

    // Simulate processing progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setProcessing(false)
          setSessionData(current => current ? { ...current, status: 'completed' } : null)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Session Not Found
            </CardTitle>
            <CardDescription>
              The session you're looking for doesn't exist or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Data Processing Session</h1>
            <p className="text-muted-foreground mt-2">
              Session ID: <code className="bg-muted px-2 py-1 rounded text-xs">{sessionId}</code>
            </p>
          </div>

          {/* File Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Name:</span>
                  <span className="text-sm">{sessionData.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Size:</span>
                  <span className="text-sm">
                    {(sessionData.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Uploaded:</span>
                  <span className="text-sm">
                    {new Date(sessionData.uploadedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sessionData.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : sessionData.status === 'processing'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : sessionData.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {sessionData.status.charAt(0).toUpperCase() + sessionData.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {processing && <Loader2 className="h-5 w-5 animate-spin" />}
                {sessionData.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                Data Processing
              </CardTitle>
              <CardDescription>
                {sessionData.status === 'uploaded' && 'Ready to process your data'}
                {processing && 'Processing your data...'}
                {sessionData.status === 'completed' && 'Data processing completed successfully!'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(processing || sessionData.status === 'completed') && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {sessionData.status === 'uploaded' && !processing && (
                    <Button onClick={startProcessing} className="flex-1">
                      Start Processing
                    </Button>
                  )}
                  
                  {sessionData.status === 'completed' && (
                    <>
                      <Button className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download Results
                      </Button>
                      <Button variant="outline">
                        View Log
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>
                This session will expire in 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>• Files are processed securely and deleted after expiration</p>
                <p>• You can bookmark this page to return to your session</p>
                <p>• Share the session ID to collaborate with others</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
