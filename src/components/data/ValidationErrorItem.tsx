'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Check, 
  X, 
  Wand2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ValidationError } from '@/lib/validators/types'

interface ValidationErrorItemProps {
  error: ValidationError
  sessionId: string
  onJumpToError?: (error: ValidationError) => void
  onFixApplied?: () => void
}

export const ValidationErrorItem: React.FC<ValidationErrorItemProps> = ({ 
  error, 
  sessionId, 
  onJumpToError, 
  onFixApplied 
}) => {
  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [fixStatus, setFixStatus] = useState<'none' | 'success' | 'error'>('none')
  
  const severityColors: Record<string, string> = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-orange-500/50 bg-orange-500/10',
    low: 'border-yellow-500/50 bg-yellow-500/10'
  }
  
  const typeIcons = {
    error: <XCircle className="h-4 w-4 text-red-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-orange-400" />
  }

  const applyAutoFix = async () => {
    if (isApplyingFix) return
    
    setIsApplyingFix(true)
    setFixStatus('none')
    
    try {
      const response = await fetch('/api/ai/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          errors: [error] // Use the same auto-fix API with single error
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Individual auto-fix response:', result)
      
      if (result.success && result.summary?.totalFixed > 0) {
        setFixStatus('success')
        console.log('Individual fix successful, triggering data refresh')
        onFixApplied?.()
        setTimeout(() => setFixStatus('none'), 3000)
      } else {
        console.log('Individual fix failed or no changes:', result)
        setFixStatus('error')
        setTimeout(() => setFixStatus('none'), 3000)
      }
    } catch (error) {
      console.error('Error applying individual fix:', error)
      setFixStatus('error')
      setTimeout(() => setFixStatus('none'), 3000)
    } finally {
      setIsApplyingFix(false)
    }
  }
  
  return (
    <div 
      className={cn(
        "p-3 border rounded-md transition-shadow bg-white/5 backdrop-blur-sm",
        severityColors[error.severity],
        fixStatus === 'success' && "border-green-400/50 bg-green-500/10",
        fixStatus === 'error' && "border-red-400/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div 
          className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-80"
          onClick={() => onJumpToError?.(error)}
        >
          {typeIcons[error.type]}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-white">
              {error.message}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Row {error.row + 1}, Column: {error.column}
            </div>
            {error.suggestion && (
              <div className="text-xs text-blue-400 mt-1 italic">
                💡 {error.suggestion}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Badge 
              variant={error.type === 'error' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {error.dataType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {error.severity}
            </Badge>
          </div>
          
          {/* AI Fix Button */}
          <div className="flex items-center gap-1 mt-1">
            {fixStatus === 'success' && (
              <Badge variant="default" className="text-xs bg-green-600/20 border-green-500/50 text-green-300">
                <Check className="h-3 w-3 mr-1" />
                Fixed
              </Badge>
            )}
            {fixStatus === 'error' && (
              <Badge variant="destructive" className="text-xs bg-red-600/20 border-red-500/50 text-red-300">
                <X className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            )}
            {fixStatus === 'none' && (
              <Button
                size="sm"
                className="h-6 px-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
                onClick={applyAutoFix}
                disabled={isApplyingFix}
                title="Auto-fix this error"
              >
                {isApplyingFix ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="h-3 w-3 mr-1" />
                    Fix
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
