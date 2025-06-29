import React from 'react'
import { Button } from "@/components/ui/button"
import { 
  Database, 
  FileText,
  Activity,
  Settings,
  TrendingUp
} from "lucide-react"

interface EmptyStateProps {
  onUploadClick: () => void
  onDemoClick: () => void
}

export function EmptyState({ onUploadClick, onDemoClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="space-y-6">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
          <Database className="w-12 h-12 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to Data Alchemist!</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Get started by uploading your first dataset. We&apos;ll help you analyze, validate, and transform your data with AI-powered insights.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={onUploadClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="w-4 h-4 mr-2" />
            Upload Your First Dataset
          </Button>
          <Button 
            onClick={onDemoClick}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <FileText className="w-4 h-4 mr-2" />
            Try with Sample Data
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-white mb-1">AI Validation</h4>
            <p className="text-xs text-gray-400">Intelligent error detection and correction suggestions</p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <Settings className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-white mb-1">Smart Rules</h4>
            <p className="text-xs text-gray-400">Generate business rules from your data patterns</p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-white mb-1">Analytics</h4>
            <p className="text-xs text-gray-400">Deep insights into your data quality and structure</p>
          </div>
        </div>
      </div>
    </div>
  )
}
