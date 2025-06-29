import React from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle, Search, Database } from "lucide-react"

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

interface FilteredEmptyStateProps {
  searchQuery: string
  statusFilter: string
  onClearFilters: () => void
  onNewAnalysis: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-red-400">{error}</p>
      <Button 
        onClick={onRetry}
        variant="outline" 
        className="mt-4"
      >
        Try Again
      </Button>
    </div>
  )
}

export function FilteredEmptyState({ 
  searchQuery, 
  statusFilter, 
  onClearFilters, 
  onNewAnalysis 
}: FilteredEmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No sessions found</h3>
      <p className="text-gray-400 mb-4">
        {searchQuery 
          ? `No sessions match "${searchQuery}"${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}` 
          : `No sessions with status "${statusFilter}"`
        }
      </p>
      <div className="flex gap-2 justify-center">
        <Button 
          onClick={onClearFilters}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Clear Filters
        </Button>
        <Button 
          onClick={onNewAnalysis}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Database className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>
    </div>
  )
}
