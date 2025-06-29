"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { FileUpload } from "@/components/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CheckSquare, ArrowRight, Database, Sparkles, Zap, Shield, Upload, TrendingUp } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { TypewriterEffect, TypewriterEffectSmooth } from "@/components/ui/animated/typewriter-effect"
import { HoverBorderGradient } from "@/components/ui/animated/hover-border-gradient"

const heroWords = [
  {
    text: "Upload",
    className: "text-blue-400",
  },
  {
    text: "&",
    className: "text-white",
  },
  {
    text: "Process",
    className: "text-blue-400",
  },
  {
    text: "Your",
    className: "text-white",
  },
  {
    text: "Data",
    className: "text-blue-400",
  },
];

export default function DataPage() {
  const router = useRouter()
  const { user } = useUser()
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

  const handleProceedToAnalysis = async () => {
    if (!canProceed) return

    try {
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

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      sessionStorage.setItem('currentSessionId', result.sessionId)
      
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Upload warnings:', result.warnings)
      }
      
      router.push(`/analysis?session=${result.sessionId}`)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="mb-6">
            <TypewriterEffectSmooth 
              words={heroWords} 
              className="text-3xl font-bold mb-2" 
            />
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
                <div 
                  className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative"
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md" />
                </div>
                <CardTitle className="text-white text-lg">Clients Data</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
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
                <div className="mt-3 text-xs text-gray-500">
                  Expected: ClientID, ClientName, Requirements, Priority
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workers Upload */}
          <div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative"
                  whileHover={{ rotate: -10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Briefcase className="h-8 w-8 text-green-400" />
                  <div className="absolute inset-0 bg-green-500/20 rounded-xl blur-md" />
                </div>
                <CardTitle className="text-white text-lg">Workers Data</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
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
                <div className="mt-3 text-xs text-gray-500">
                  Expected: WorkerID, Name, Skills, Availability, Rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Upload */}
          <div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 relative"
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <CheckSquare className="h-8 w-8 text-purple-400" />
                  <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-md" />
                </div>
                <CardTitle className="text-white text-lg">Tasks Data</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
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
                <div className="mt-3 text-xs text-gray-500">
                  Expected: TaskID, ClientID, Duration, Skills, Deadline
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Status & Action */}
        <div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Database className="h-4 w-4" />
                    Upload Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div 
                        className={`w-full h-2 rounded-full mb-2 ${
                          uploadedFiles.clients ? 'bg-blue-500' : 'bg-white/10'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: uploadedFiles.clients ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="text-xs font-medium text-white">Clients</div>
                      <div className={`text-xs ${
                        uploadedFiles.clients ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        {uploadedFiles.clients ? '✓ Ready' : 'Pending'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div 
                        className={`w-full h-2 rounded-full mb-2 ${
                          uploadedFiles.workers ? 'bg-green-500' : 'bg-white/10'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: uploadedFiles.workers ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="text-xs font-medium text-white">Workers</div>
                      <div className={`text-xs ${
                        uploadedFiles.workers ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {uploadedFiles.workers ? '✓ Ready' : 'Pending'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div 
                        className={`w-full h-2 rounded-full mb-2 ${
                          uploadedFiles.tasks ? 'bg-purple-500' : 'bg-white/10'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: uploadedFiles.tasks ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="text-xs font-medium text-white">Tasks</div>
                      <div className={`text-xs ${
                        uploadedFiles.tasks ? 'text-purple-400' : 'text-gray-500'
                      }`}>
                        {uploadedFiles.tasks ? '✓ Ready' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <HoverBorderGradient
                    containerClassName="w-full"
                    className="w-full"
                    as="div"
                  >
                    <Button 
                      onClick={handleProceedToAnalysis}
                      disabled={!canProceed}
                      className="w-full bg-transparent border-0 hover:bg-transparent text-white"
                      size="lg"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analyze Data
                    </Button>
                  </HoverBorderGradient>
                  {!canProceed && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Upload at least one file to continue
                    </p>
                  )}
                  {canProceed && (
                    <motion.p 
                      className="text-sm text-green-400 text-center mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {Object.values(uploadedFiles).filter(Boolean).length} file(s) ready for analysis
                    </motion.p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Features Preview */}
        <div 
          className="grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div 
            className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">AI Validation</h3>
            <p className="text-gray-400 text-sm">
              Intelligent data validation with AI-powered error detection and correction suggestions
            </p>
          </div>
          
          <div 
            className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Smart Rules</h3>
            <p className="text-gray-400 text-sm">
              Generate scheduling rules automatically based on your data patterns and constraints
            </p>
          </div>
          
          <div 
            className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Clean Export</h3>
            <p className="text-gray-400 text-sm">
              Export validated data and generated rules ready for your scheduling system
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
