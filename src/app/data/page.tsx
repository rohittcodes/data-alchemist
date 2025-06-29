"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileUpload, FeaturesSection, RecentSessions } from "@/components/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowRight } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { HoverBorderGradient } from "@/components/ui/animated/hover-border-gradient"
import { useSessions } from "@/hooks/useSessions"
import { useFileUpload } from "@/hooks/useFileUpload"

export default function DataPage() {
  const router = useRouter()
  const { sessions, loading: loadingSessions } = useSessions()
  const {
    uploadedFiles,
    isUploading,
    uploadError,
    isCreatingPreview,
    handleFileSelect,
    handleViewFile,
    proceedToAnalysis
  } = useFileUpload()

  const hasFiles = Object.values(uploadedFiles).some(file => file !== null)

  const handleAnalyze = (sessionId: string) => {
    router.push(`/analysis/${sessionId}`)
  }

  const handleView = (sessionId: string) => {
    router.push(`/data/session?session=${sessionId}`)
  }

  const handleProceedToAnalysis = () => {
    proceedToAnalysis(router)
  }

  const handleViewFileWrapper = (file: File, type: string) => {
    handleViewFile(file, type, router)
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Upload Your Data
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform raw data into actionable insights with AI-powered analysis and validation
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Data Files
            </CardTitle>
            <CardDescription className="text-gray-400">
              Upload your CSV files to get started with analysis. You can upload clients, workers, and tasks data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Error */}
            {uploadError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{uploadError}</p>
              </div>
            )}

            {/* File Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload
                title="Clients Data"
                description="Upload your client information"
                type="clients"
                onFileSelect={handleFileSelect('clients')}
                onView={handleViewFileWrapper}
                isViewLoading={isCreatingPreview}
              />
              <FileUpload
                title="Workers Data"
                description="Upload your worker information"
                type="workers"
                onFileSelect={handleFileSelect('workers')}
                onView={handleViewFileWrapper}
                isViewLoading={isCreatingPreview}
              />
              <FileUpload
                title="Tasks Data"
                description="Upload your task information"
                type="tasks"
                onFileSelect={handleFileSelect('tasks')}
                onView={handleViewFileWrapper}
                isViewLoading={isCreatingPreview}
              />
            </div>

            {/* Proceed Button */}
            {hasFiles && (
              <div className="flex justify-center pt-6">
                <HoverBorderGradient as="div">
                  <Button
                    variant="ghost"
                    onClick={handleProceedToAnalysis}
                    disabled={isUploading || isCreatingPreview}
                    className="text-white px-8 py-3 text-lg font-medium hover:bg-transparent"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"></div>
                        Creating Session...
                      </>
                    ) : (
                      <>
                        Proceed to Analysis
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </HoverBorderGradient>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <FeaturesSection />

        {/* Recent Sessions */}
        <RecentSessions
          sessions={sessions}
          loading={loadingSessions}
          onAnalyze={handleAnalyze}
          onView={handleView}
        />
      </div>
    </AppLayout>
  )
}
