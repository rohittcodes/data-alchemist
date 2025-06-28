'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { ValidationError } from '@/lib'

interface CriticalIssuesProps {
  criticalIssues: ValidationError[]
  onJumpToError?: (error: ValidationError) => void
}

export const CriticalIssues: React.FC<CriticalIssuesProps> = ({ 
  criticalIssues, 
  onJumpToError 
}) => {
  if (criticalIssues.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-red-800 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Critical Issues ({criticalIssues.length})
      </h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {criticalIssues.slice(0, 5).map((error, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded text-sm cursor-pointer hover:bg-red-100"
            onClick={() => onJumpToError?.(error)}
          >
            <span className="text-red-800 truncate">{error.message}</span>
            <Badge variant="destructive" className="text-xs">
              {error.dataType}
            </Badge>
          </div>
        ))}
        {criticalIssues.length > 5 && (
          <div className="text-xs text-red-600 text-center">
            +{criticalIssues.length - 5} more critical issues
          </div>
        )}
      </div>
    </div>
  )
}
