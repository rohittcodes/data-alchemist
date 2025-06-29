'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X, Zap } from 'lucide-react'
import { ValidationError } from '@/lib/validators/types'

interface AutoFixSectionProps {
  sessionId: string
  autoFixableErrors: ValidationError[]
  onDataUpdated?: () => void
}

interface AutoFixResult {
  totalFixed: number
  totalAttempted: number
}

export const AutoFixSection: React.FC<AutoFixSectionProps> = ({
  sessionId,
  autoFixableErrors,
  onDataUpdated
}) => {
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [autoFixStatus, setAutoFixStatus] = useState<'none' | 'success' | 'error'>('none')
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null)

  const autoFixSimpleErrors = async () => {
    if (isAutoFixing || autoFixableErrors.length === 0) return
    
    setIsAutoFixing(true)
    setAutoFixStatus('none')
    setAutoFixResult(null)
    
    try {
      console.log('Starting auto-fix for', autoFixableErrors.length, 'errors')
      console.log('Auto-fixable errors:', autoFixableErrors)
      
      const response = await fetch('/api/ai/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          errors: autoFixableErrors
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Auto-fix API response:', result)
      
      if (result.success && result.summary) {
        setAutoFixStatus('success')
        setAutoFixResult(result.summary)
        
        console.log(`Auto-fixed ${result.summary.totalFixed} issues out of ${result.summary.totalAttempted} attempted`)
        console.log('Details:', result.details)
        
        if (result.summary.totalFixed > 0) {
          console.log(`✅ Successfully fixed ${result.summary.totalFixed} issues`)
          if (result.summary.totalRequireManual > 0) {
            console.log(`⚠️ ${result.summary.totalRequireManual} issues still require manual review`)
          }
          
          // Force data refresh immediately
          console.log('Triggering data refresh after successful auto-fix')
          onDataUpdated?.()
          
          // Also trigger a second refresh after a short delay to ensure validation is updated
          setTimeout(() => {
            console.log('Triggering secondary data refresh for validation update')
            onDataUpdated?.()
          }, 1000)
        }
        
        // Reset status after showing success
        setTimeout(() => {
          setAutoFixStatus('none')
          setAutoFixResult(null)
        }, 5000)
      } else {
        console.error('Auto-fix failed:', result.error || result.message || 'Unknown error')
        console.error('Full response:', result)
        setAutoFixStatus('error')
        setTimeout(() => setAutoFixStatus('none'), 5000)
      }
    } catch (error) {
      console.error('Auto-fix request failed:', error)
      setAutoFixStatus('error')
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        console.error('Network error: AI services temporarily unavailable')
      } else {
        console.error('Auto-fix error:', errorMessage)
      }
      
      setTimeout(() => setAutoFixStatus('none'), 5000)
    } finally {
      setIsAutoFixing(false)
    }
  }

  if (autoFixableErrors.length === 0) {
    return null
  }

  return (
    <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-blue-300">Auto-fixable Issues</span>
          <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-300">
            {autoFixableErrors.length}
          </Badge>
        </div>
        <Button
          onClick={autoFixSimpleErrors}
          disabled={isAutoFixing}
          size="sm"
          className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
        >
          {isAutoFixing ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-2" />
              Auto-fix All
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-blue-400/80 mb-2">
        Simple formatting, data type, and default value issues that can be fixed automatically
      </p>
      {autoFixStatus === 'success' && autoFixResult && (
        <div className="space-y-1">
          <Badge variant="default" className="bg-green-600/20 border-green-500/50 text-green-300">
            <Check className="h-3 w-3 mr-1" />
            {autoFixResult.totalFixed} of {autoFixResult.totalAttempted} issues fixed
          </Badge>
          {autoFixResult.totalAttempted - autoFixResult.totalFixed > 0 && (
            <div className="text-xs text-orange-400">
              {autoFixResult.totalAttempted - autoFixResult.totalFixed} issues still need manual review
            </div>
          )}
        </div>
      )}
      {autoFixStatus === 'error' && (
        <Badge variant="destructive" className="text-xs bg-red-600/20 border-red-500/50 text-red-300">
          <X className="h-3 w-3 mr-1" />
          Auto-fix failed
        </Badge>
      )}
    </div>
  )
}
