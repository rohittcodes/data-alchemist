'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wand2,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { ValidationSummary, ValidationError } from '@/lib'
import { cn } from '@/lib/utils'
import { canAutoFix } from '@/lib/validators/auto-fix'

// Import modular components
import { AutoFixSection } from './AutoFixSection'
import { ErrorCategories } from './ErrorCategories'
import { CriticalIssues } from './CriticalIssues'
import { HealthScore } from './HealthScore'
import { IssuesByCategory } from './IssuesByCategory'
import { DetailedIssuesTabs } from './DetailedIssuesTabs'

interface ValidationPanelProps {
  validation: ValidationSummary
  sessionId: string
  onJumpToError?: (error: ValidationError) => void
  onDataUpdated?: () => void
  className?: string
}

// Categorize errors by fix type
interface ErrorCategorization {
  autoFixable: ValidationError[]
  manualReview: ValidationError[]
  businessDecisions: ValidationError[]
}

function categorizeErrors(errors: ValidationError[]): ErrorCategorization {
  const autoFixable: ValidationError[] = []
  const manualReview: ValidationError[] = []
  const businessDecisions: ValidationError[] = []
  
  console.log('Categorizing', errors.length, 'errors')
  
  for (const error of errors) {
    const isAutoFixable = canAutoFix(error)
    console.log(`Error categorization: ${error.category}/${error.severity} - ${error.message.substring(0, 50)} -> ${isAutoFixable ? 'AUTO-FIXABLE' : 'MANUAL'}`)
    
    if (isAutoFixable) {
      autoFixable.push(error)
    } else if (error.category === 'business' || error.category === 'skill') {
      businessDecisions.push(error)
    } else {
      manualReview.push(error)
    }
  }
  
  console.log('Categorization results:', {
    autoFixable: autoFixable.length,
    manualReview: manualReview.length,
    businessDecisions: businessDecisions.length
  })
  
  return { autoFixable, manualReview, businessDecisions }
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validation,
  sessionId,
  onJumpToError,
  onDataUpdated,
  className
}) => {
  const [isBatchFixing, setIsBatchFixing] = useState(false)
  const [batchFixStatus, setBatchFixStatus] = useState<'none' | 'success' | 'error'>('none')
  
  const { totalErrors, totalWarnings, errorsByCategory, criticalIssues, allErrors } = validation
  const errorCategories = categorizeErrors(allErrors)
  
  const totalIssues = totalErrors + totalWarnings
  const healthScore = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10 + totalWarnings * 3))

  const batchFix = async () => {
    if (isBatchFixing || allErrors.length === 0) return
    
    setIsBatchFixing(true)
    setBatchFixStatus('none')
    
    try {
      const fixableErrors = allErrors.filter(error => 
        ['required', 'datatype'].includes(error.category) && 
        error.severity !== 'low'
      )
      
      for (const error of fixableErrors) {
        try {
          const suggestResponse = await fetch('/api/ai/suggest-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              error,
              context: {}
            })
          })
          
          if (suggestResponse.ok) {
            const { suggestion } = await suggestResponse.json()
            
            if (suggestion && suggestion.isAutomatable && suggestion.confidence !== 'low') {
              await fetch('/api/ai/apply-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  error,
                  suggestedValue: suggestion.suggestedValue,
                  applyToAll: error.category === 'required' || error.category === 'datatype'
                })
              })
            }
          }
        } catch (error) {
          console.error('Error in batch fix for error:', error)
        }
      }
      
      setBatchFixStatus('success')
      onDataUpdated?.()
      setTimeout(() => setBatchFixStatus('none'), 3000)
      
    } catch (error) {
      console.error('Batch fix error:', error)
      setBatchFixStatus('error')
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        console.error('Network error: AI services temporarily unavailable for batch fixing')
      } else {
        console.error('Batch fix error:', errorMessage)
      }
      
      setTimeout(() => setBatchFixStatus('none'), 3000)
    } finally {
      setIsBatchFixing(false)
    }
  }

  if (totalIssues === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Data Validation Passed</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            All data meets quality standards. No issues found.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {totalErrors > 0 ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            <CardTitle>Data Validation Results</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Batch Fix Button */}
            {totalErrors > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={batchFix}
                disabled={isBatchFixing}
                className="text-xs"
              >
                {isBatchFixing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3 mr-1" />
                    Batch Fix
                  </>
                )}
              </Button>
            )}
            
            {batchFixStatus === 'success' && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Fixed
              </Badge>
            )}
            
            {batchFixStatus === 'error' && (
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            
            <span className="text-sm text-muted-foreground">Health Score:</span>
            <Badge 
              variant={healthScore >= 80 ? "default" : healthScore >= 60 ? "secondary" : "destructive"}
              className="font-bold"
            >
              {healthScore}%
            </Badge>
          </div>
        </div>
        <CardDescription>
          Found {totalErrors} error{totalErrors !== 1 ? 's' : ''} and {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} across your data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Health Score and Summary Stats */}
        <HealthScore 
          healthScore={healthScore}
          totalErrors={totalErrors}
          totalWarnings={totalWarnings}
        />
        
        {/* Critical Issues */}
        <CriticalIssues 
          criticalIssues={criticalIssues}
          onJumpToError={onJumpToError}
        />
        
        {/* Fix Recommendations */}
        <div className="space-y-4">
          <h4 className="font-medium">Fix Recommendations</h4>
          
          {/* Auto-fixable Errors */}
          <AutoFixSection
            sessionId={sessionId}
            autoFixableErrors={errorCategories.autoFixable}
            onDataUpdated={onDataUpdated}
          />
          
          {/* Manual Review and Business Decisions */}
          <ErrorCategories 
            categories={{
              manualReview: errorCategories.manualReview.length,
              businessDecisions: errorCategories.businessDecisions.length
            }}
          />
        </div>
        
        {/* Issues by Category */}
        <IssuesByCategory errorsByCategory={errorsByCategory} />
        
        {/* Detailed Issues by Data Type */}
        <DetailedIssuesTabs
          allErrors={allErrors}
          sessionId={sessionId}
          onJumpToError={onJumpToError}
          onDataUpdated={onDataUpdated}
        />
        
        {/* Batch Fix Section */}
        {totalErrors > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Batch Fix Errors ({totalErrors})
              </h4>
              {batchFixStatus === 'success' && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Fixed
                </Badge>
              )}
              {batchFixStatus === 'error' && (
                <Badge variant="destructive" className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
