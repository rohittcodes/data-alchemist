"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/global/FileUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CheckSquare, ArrowRight, Database } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = React.useState<{
    clients?: File
    workers?: File
    tasks?: File
  }>({})

  const handleFileSelect = (fileType: 'clients' | 'workers' | 'tasks') => (file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file || undefined
    }))
  }

  const canProceed = Object.values(uploadedFiles).filter(Boolean).length > 0

  const handleProceedToDashboard = async () => {
    if (!canProceed) return

    try {
      // Create FormData with all uploaded files
      const formData = new FormData()
      
      if (uploadedFiles.clients) {
        formData.append('clients', uploadedFiles.clients)
      }
      if (uploadedFiles.workers) {
        formData.append('workers', uploadedFiles.workers)
      }
      if (uploadedFiles.tasks) {
        formData.append('tasks', uploadedFiles.tasks)
      }

      // Upload and parse files
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Store session ID and redirect to dashboard
      sessionStorage.setItem('currentSessionId', result.sessionId)
      
      // Show any warnings if present
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Upload warnings:', result.warnings)
      }
      
      router.push(`/dashboard?session=${result.sessionId}`)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Data Alchemist
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-2">
            Transform your workforce data with AI-powered validation and intelligent rule generation
          </p>
          <p className="text-sm text-muted-foreground">
            Upload your client, worker, and task data to get started
          </p>
        </div>

        {/* 3 File Upload Zones */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
          {/* Clients Upload */}
          <Card className="transition-all hover:shadow-lg border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Clients Data</CardTitle>
              <CardDescription className="text-sm">
                Upload your client information and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <FileUpload
                title=""
                description="Drop clients CSV/Excel here"
                acceptedTypes=".csv,.xlsx,.xls"
                maxSize={25}
                onFileSelect={handleFileSelect('clients')}
                className="w-full"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Expected: ClientID, ClientName, Requirements, Priority
              </div>
            </CardContent>
          </Card>

          {/* Workers Upload */}
          <Card className="transition-all hover:shadow-lg border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Workers Data</CardTitle>
              <CardDescription className="text-sm">
                Upload worker profiles and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <FileUpload
                title=""
                description="Drop workers CSV/Excel here"
                acceptedTypes=".csv,.xlsx,.xls"
                maxSize={25}
                onFileSelect={handleFileSelect('workers')}
                className="w-full"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Expected: WorkerID, Name, Skills, Availability, Rate
              </div>
            </CardContent>
          </Card>

          {/* Tasks Upload */}
          <Card className="transition-all hover:shadow-lg border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Tasks Data</CardTitle>
              <CardDescription className="text-sm">
                Upload task definitions and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <FileUpload
                title=""
                description="Drop tasks CSV/Excel here"
                acceptedTypes=".csv,.xlsx,.xls"
                maxSize={25}
                onFileSelect={handleFileSelect('tasks')}
                className="w-full"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Expected: TaskID, ClientID, Duration, Skills, Deadline
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Status & Action */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Upload Status
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`w-full h-2 rounded-full mb-2 ${
                      uploadedFiles.clients ? 'bg-blue-500' : 'bg-muted'
                    }`} />
                    <div className="text-xs font-medium">Clients</div>
                    <div className={`text-xs ${
                      uploadedFiles.clients ? 'text-blue-600' : 'text-muted-foreground'
                    }`}>
                      {uploadedFiles.clients ? '✓ Ready' : 'Pending'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`w-full h-2 rounded-full mb-2 ${
                      uploadedFiles.workers ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <div className="text-xs font-medium">Workers</div>
                    <div className={`text-xs ${
                      uploadedFiles.workers ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {uploadedFiles.workers ? '✓ Ready' : 'Pending'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`w-full h-2 rounded-full mb-2 ${
                      uploadedFiles.tasks ? 'bg-purple-500' : 'bg-muted'
                    }`} />
                    <div className="text-xs font-medium">Tasks</div>
                    <div className={`text-xs ${
                      uploadedFiles.tasks ? 'text-purple-600' : 'text-muted-foreground'
                    }`}>
                      {uploadedFiles.tasks ? '✓ Ready' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleProceedToDashboard}
                  disabled={!canProceed}
                  className="w-full"
                  size="lg"
                >
                  Process Data & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!canProceed && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Upload at least one file to continue
                  </p>
                )}
                {canProceed && (
                  <p className="text-sm text-green-600 text-center mt-2">
                    {Object.values(uploadedFiles).filter(Boolean).length} file(s) ready for processing
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
            <p className="text-muted-foreground">
              Drag and drop or click to upload your data files with instant validation
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Processing</h3>
            <p className="text-muted-foreground">
              Automated data analysis and transformation with real-time progress tracking
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
            <p className="text-muted-foreground">
              Download processed results in multiple formats with detailed reports
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-muted/30">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Validation</h3>
            <p className="text-muted-foreground text-sm">
              Intelligent data validation with AI-powered error detection and correction suggestions
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-muted/30">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Rules</h3>
            <p className="text-muted-foreground text-sm">
              Generate scheduling rules automatically based on your data patterns and constraints
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-muted/30">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Clean Export</h3>
            <p className="text-muted-foreground text-sm">
              Export validated data and generated rules ready for your scheduling system
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Secure processing • Data validation • AI-powered insights
          </p>
        </div>
      </div>
    </div>
  );
}
