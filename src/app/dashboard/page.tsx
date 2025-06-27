"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  ArrowLeft, 
  Database,
  Eye,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface FileInfo {
  fileName: string
  rowCount: number
  headers: string[]
  fileSize: number
}

interface SessionInfo {
  sessionId: string
  status: string
  created: number
  lastModified: number
  files: {
    clients?: FileInfo | null
    workers?: FileInfo | null
    tasks?: FileInfo | null
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = React.useState<SessionInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get session ID from URL params or sessionStorage
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('session') || sessionStorage.getItem('currentSessionId')
        
        if (!sessionId) {
          setError('No session found')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/session/${sessionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }
        
        const data = await response.json()
        setSessionData(data)
      } catch (err) {
        console.error('Failed to fetch session data:', err)
        setError('Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [])

  const fileCount = sessionData ? Object.values(sessionData.files).filter(Boolean).length : 0
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading session data...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData || fileCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {error || 'No Data Found'}
            </CardTitle>
            <CardDescription>
              {error || 'No uploaded files found. Please go back and upload your data files.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Database className="h-8 w-8 text-primary" />
                  Data Processing Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  {fileCount} file{fileCount !== 1 ? 's' : ''} uploaded and ready for processing
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/data?session=${sessionData.sessionId}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View & Edit Data
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className={sessionData.files.clients ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients Data</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {sessionData.files.clients ? (
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{sessionData.files.clients.rowCount} rows</div>
                    <p className="text-xs text-muted-foreground">
                      {sessionData.files.clients.fileName} • {(sessionData.files.clients.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columns: {sessionData.files.clients.headers.join(', ')}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Parsed
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">Not uploaded</div>
                    <p className="text-xs text-muted-foreground">No client data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={sessionData.files.workers ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers Data</CardTitle>
                <Briefcase className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {sessionData.files.workers ? (
                  <div>
                    <div className="text-2xl font-bold text-green-600">{sessionData.files.workers.rowCount} rows</div>
                    <p className="text-xs text-muted-foreground">
                      {sessionData.files.workers.fileName} • {(sessionData.files.workers.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columns: {sessionData.files.workers.headers.join(', ')}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Parsed
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">Not uploaded</div>
                    <p className="text-xs text-muted-foreground">No worker data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={sessionData.files.tasks ? "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Data</CardTitle>
                <CheckSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {sessionData.files.tasks ? (
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{sessionData.files.tasks.rowCount} rows</div>
                    <p className="text-xs text-muted-foreground">
                      {sessionData.files.tasks.fileName} • {(sessionData.files.tasks.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columns: {sessionData.files.tasks.headers.join(', ')}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Parsed
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">Not uploaded</div>
                    <p className="text-xs text-muted-foreground">No task data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="data" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Data
              </TabsTrigger>
              <TabsTrigger value="validate" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Validation
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    Preview your uploaded data files and their structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Data preview functionality will be implemented here. This will show:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Column headers and data types</li>
                      <li>Sample rows from each uploaded file</li>
                      <li>Data quality indicators</li>
                      <li>Relationship mapping between entities</li>
                    </ul>
                    <Button>
                      <Eye className="mr-2 h-4 w-4" />
                      Open Data Viewer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Validation</CardTitle>
                  <CardDescription>
                    Intelligent validation with error detection and correction suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      AI validation engine will check for:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Duplicate IDs and missing required fields</li>
                      <li>Invalid data types and format issues</li>
                      <li>Reference integrity (TaskIDs, ClientIDs, WorkerIDs)</li>
                      <li>Business logic violations</li>
                      <li>Circular dependencies and conflicts</li>
                    </ul>
                    <Button>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Start AI Validation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Smart Rule Builder</CardTitle>
                  <CardDescription>
                    Generate and customize scheduling rules based on your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate intelligent rules for:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Co-run requirements and dependencies</li>
                      <li>Load limits and capacity constraints</li>
                      <li>Phase windows and timing rules</li>
                      <li>Worker availability and skills matching</li>
                      <li>Client priority and scheduling preferences</li>
                    </ul>
                    <Button>
                      <Settings className="mr-2 h-4 w-4" />
                      Open Rule Builder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Clean Data</CardTitle>
                  <CardDescription>
                    Download validated data and generated rules ready for your scheduling system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col gap-2">
                        <Database className="h-6 w-6" />
                        <span>Clean CSV Files</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2">
                        <Settings className="h-6 w-6" />
                        <span>Rules JSON</span>
                      </Button>
                    </div>
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
