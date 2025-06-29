import React from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Database, FileText } from "lucide-react"

interface AnalysisHeaderProps {
  sessionId: string
  onBack: () => void
  onDataViewClick: () => void
  onRulesClick: () => void
  onExportClick: () => void
}

export function AnalysisHeader({ 
  sessionId, 
  onBack, 
  onDataViewClick, 
  onRulesClick, 
  onExportClick 
}: AnalysisHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Session Analysis
          </h1>
          <p className="text-gray-400 mt-1">
            Session ID: {sessionId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onDataViewClick}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Database className="w-4 h-4 mr-2" />
          View Data
        </Button>
        <Button
          onClick={onRulesClick}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          Rules
        </Button>
        <Button
          onClick={onExportClick}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )
}
