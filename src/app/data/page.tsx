"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { FileUpload } from "@/components/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CheckSquare, ArrowRight, Database, Sparkles, Zap, Shield, Upload, TrendingUp, Activity, Eye } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { HoverBorderGradient } from "@/components/ui/animated/hover-border-gradient"

const features = [
  {
    title: "Smart Validation",
    description: "AI-powered data quality checks",
    icon: Shield,
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "Auto Processing",
    description: "Automated data parsing and analysis",
    icon: Zap,
    color: "from-blue-500 to-cyan-600"
  },
  {
    title: "Instant Insights",
    description: "Real-time analytics and reporting",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600"
  }
]

export default function DataPage() {
  const router = useRouter()
  const { user } = useUser()
  const [uploadedFiles, setUploadedFiles] = React.useState<{[key: string]: File | null}>({
    clients: null,
    workers: null,
    tasks: null
  })
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [isCreatingPreview, setIsCreatingPreview] = React.useState(false)
  const [recentSessions, setRecentSessions] = React.useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(false)

  const handleFileSelect = (type: 'clients' | 'workers' | 'tasks') => (file: File | null) => {
    console.log(`File selected for ${type}:`, file)
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const handleViewFile = async (file: File, type: string) => {
    setIsCreatingPreview(true)
    setUploadError(null)
    try {
      // Parse CSV file
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('File is empty')
      }

      // Simple CSV parsing (handles basic cases)
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = line[i + 1]
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"'
              i++ // skip next quote
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0])
      const data = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })

      // Create a temporary session for preview
      const sessionData = {
        [type]: data
      }

      const response = await fetch('/api/session/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: sessionData })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create preview session')
      }

      const result = await response.json()
      
      // Navigate to data view page
      router.push(`/data/view/${type}?session=${result.sessionId}`)
    } catch (error) {
      console.error('Failed to create preview:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to create preview')
    } finally {
      setIsCreatingPreview(false)
    }
  }

  const allFilesUploaded = uploadedFiles.clients && uploadedFiles.workers && uploadedFiles.tasks

  const handleProceedToAnalysis = async () => {
    if (!allFilesUploaded) return
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      const formData = new FormData()
      
      // Add files to FormData
      if (uploadedFiles.clients) formData.append('clients', uploadedFiles.clients)
      if (uploadedFiles.workers) formData.append('workers', uploadedFiles.workers)
      if (uploadedFiles.tasks) formData.append('tasks', uploadedFiles.tasks)
      
      console.log('Uploading files...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const result = await response.json()
      console.log('Upload successful:', result)
      
      // Navigate to analysis page with the session ID
      if (result.sessionId) {
        router.push(`/analysis/${result.sessionId}`)
      } else {
        router.push('/analysis')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Load recent sessions on component mount
  React.useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        setLoadingSessions(true)
        const response = await fetch('/api/sessions')
        if (response.ok) {
          const data = await response.json()
          setRecentSessions((data.sessions || []).slice(0, 3)) // Show only 3 most recent
        }
      } catch (error) {
        console.error('Failed to fetch recent sessions:', error)
      } finally {
        setLoadingSessions(false)
      }
    }

    fetchRecentSessions()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Upload & Process Your Data
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.firstName}! Upload your workforce data to get started with AI-powered validation.
            </p>
          </div>
        </div>

        {/* Upload Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clients Upload */}
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-lg">Clients Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload client requirements and project details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload 
                  onFileSelect={handleFileSelect('clients')}
                  acceptedTypes=".csv,.xlsx"
                  title="Upload Clients File"
                  description="CSV format with columns: clientId, clientName, requirements, priority"
                  type="clients"
                  onView={handleViewFile}
                  isViewLoading={isCreatingPreview}
                />
                <div className="text-xs text-gray-500 text-center">
                  CSV format with columns: clientId, clientName, requirements, priority
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workers Upload */}
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-lg">Workers Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload your workforce skills and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload 
                  onFileSelect={handleFileSelect('workers')}
                  acceptedTypes=".csv,.xlsx"
                  title="Upload Workers File"
                  description="CSV format with columns: workerId, name, skills, availability, rate"
                  type="workers"
                  onView={handleViewFile}
                  isViewLoading={isCreatingPreview}
                />
                <div className="text-xs text-gray-500 text-center">
                  CSV format with columns: workerId, name, skills, availability, rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Upload */}
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-lg">Tasks Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload your project tasks and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload 
                  onFileSelect={handleFileSelect('tasks')}
                  acceptedTypes=".csv,.xlsx"
                  title="Upload Tasks File"
                  description="CSV format with columns: taskId, clientId, duration, skills, deadline"
                  type="tasks"
                  onView={handleViewFile}
                  isViewLoading={isCreatingPreview}
                />
                <div className="text-xs text-gray-500 text-center">
                  CSV format with columns: taskId, clientId, duration, skills, deadline
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Section */}
        {(uploadedFiles.clients || uploadedFiles.workers || uploadedFiles.tasks) && (
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Upload Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Clients</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: uploadedFiles.clients ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Workers</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: uploadedFiles.workers ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Tasks</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: uploadedFiles.tasks ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                </div>

                {allFilesUploaded && (
                  <div className="text-center pt-4">
                    <p className="text-green-400 mb-4 flex items-center justify-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      All files uploaded successfully! Ready for analysis.
                    </p>
                    
                    {uploadError && (
                      <p className="text-red-400 mb-4 text-sm">
                        {uploadError}
                      </p>
                    )}
                    
                    {isCreatingPreview && (
                      <p className="text-blue-400 mb-4 text-sm flex items-center justify-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400"></div>
                        Creating preview...
                      </p>
                    )}
                    
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleProceedToAnalysis}
                        disabled={isUploading}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Proceed to Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Sessions */}
        {!loadingSessions && recentSessions.length > 0 && (
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Quick access to your recent data uploads for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.map((session, index) => (
                  <div key={session.sessionId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          Session {session.sessionId.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(session.created).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {session.files?.clients && (
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            Clients: {session.files.clients.rowCount}
                          </span>
                        )}
                        {session.files?.workers && (
                          <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                            Workers: {session.files.workers.rowCount}
                          </span>
                        )}
                        {session.files?.tasks && (
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            Tasks: {session.files.tasks.rowCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/analysis/${session.sessionId}`)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        Analyze
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/data/session?session=${session.sessionId}`)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Button
                    onClick={() => router.push('/analysis')}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    View All Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index}>
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
