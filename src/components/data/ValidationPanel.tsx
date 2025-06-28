'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  Target,
  Database,
  Wand2,
  Loader2,
  Check,
  X,
  Zap,
  UserX,
  Settings
} from 'lucide-react'
import { ValidationSummary, ValidationError } from '@/lib'
import { cn } from '@/lib/utils'
import { canAutoFix } from '@/lib/validators/auto-fix'

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
    // Use the actual auto-fix logic to determine if error can be fixed
    const isAutoFixable = canAutoFix(error)
    console.log(`Error categorization: ${error.category}/${error.severity} - ${error.message.substring(0, 50)} -> ${isAutoFixable ? 'AUTO-FIXABLE' : 'MANUAL'}`)
    
    if (isAutoFixable) {
      autoFixable.push(error)
    }
    // Business logic and skill matching requires human decision
    else if (error.category === 'business' || error.category === 'skill') {
      businessDecisions.push(error)
    }
    // Everything else needs manual review
    else {
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
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [batchFixStatus, setBatchFixStatus] = useState<'none' | 'success' | 'error'>('none')
  const [autoFixStatus, setAutoFixStatus] = useState<'none' | 'success' | 'error'>('none')
  const [autoFixResult, setAutoFixResult] = useState<{ totalFixed: number; totalAttempted: number } | null>(null)
  
  const { totalErrors, totalWarnings, errorsByCategory, criticalIssues, allErrors } = validation
  const errorCategories = categorizeErrors(allErrors)
  
  const totalIssues = totalErrors + totalWarnings
  const healthScore = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10 + totalWarnings * 3))
  
  const categoryIcons: Record<string, React.ReactNode> = {
    duplicate: <Copy className="h-4 w-4" />,
    required: <AlertTriangle className="h-4 w-4" />,
    reference: <Target className="h-4 w-4" />,
    skill: <TrendingUp className="h-4 w-4" />,
    datatype: <Database className="h-4 w-4" />,
    business: <Users className="h-4 w-4" />
  }
  
  const categoryNames: Record<string, string> = {
    duplicate: 'Duplicate IDs',
    required: 'Missing Required',
    reference: 'Invalid References',
    skill: 'Skill Coverage',
    datatype: 'Data Types',
    business: 'Business Logic'
  }
  
  const severityColors: Record<string, string> = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-orange-600 bg-orange-50',
    low: 'text-yellow-600 bg-yellow-50'
  }

  // Auto-fix function for simple validation errors
  const autoFixSimpleErrors = async () => {
    if (isAutoFixing || errorCategories.autoFixable.length === 0) return
    
    setIsAutoFixing(true)
    setAutoFixStatus('none')
    
    try {
      console.log('Starting auto-fix for', errorCategories.autoFixable.length, 'errors')
      console.log('Auto-fixable errors:', errorCategories.autoFixable)
      
      const response = await fetch('/api/ai/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          errors: errorCategories.autoFixable
        })
      })
      
      const result = await response.json()
      console.log('Auto-fix API response:', result)
      
      if (response.ok && result.success) {
        setAutoFixStatus('success')
        setAutoFixResult(result.summary) // Store the actual fix results
        
        // Force a refresh of the session data by calling onDataUpdated
        console.log(`Auto-fixed ${result.summary.totalFixed} issues out of ${result.summary.totalAttempted} attempted`)
        console.log('Details:', result.details)
        
        // Show more detailed feedback
        if (result.summary.totalFixed > 0) {
          console.log(`✅ Successfully fixed ${result.summary.totalFixed} issues`)
          if (result.summary.totalRequireManual > 0) {
            console.log(`⚠️ ${result.summary.totalRequireManual} issues still require manual review`)
          }
        }
        
        // Wait a moment then refresh the data
        setTimeout(() => {
          onDataUpdated?.()
        }, 500)
        
        // Reset status after showing success
        setTimeout(() => {
          setAutoFixStatus('none')
          setAutoFixResult(null)
        }, 5000)
      } else {
        console.error('Auto-fix failed:', result.error || 'Unknown error')
        console.error('Full response:', result)
        setAutoFixStatus('error')
        setTimeout(() => setAutoFixStatus('none'), 5000)
      }
    } catch (error) {
      console.error('Auto-fix request failed:', error)
      setAutoFixStatus('error')
      
      // Show user-friendly error message
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

  const batchFix = async () => {
    if (isBatchFixing || allErrors.length === 0) return
    
    setIsBatchFixing(true)
    setBatchFixStatus('none')
    
    try {
      // Process fixable errors (required fields and data type issues)
      const fixableErrors = allErrors.filter(error => 
        ['required', 'datatype'].includes(error.category) && 
        error.severity !== 'low'
      )
      
      for (const error of fixableErrors) {
        try {
          // Get AI suggestion
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
              // Apply the fix
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
      
      // Show user-friendly error message
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
        {/* Health Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Data Quality Score</span>
            <span className="font-medium">{healthScore}%</span>
          </div>
          <Progress 
            value={healthScore} 
            className={cn(
              "h-2",
              healthScore >= 80 && "[&>div]:bg-green-500",
              healthScore >= 60 && healthScore < 80 && "[&>div]:bg-orange-500",
              healthScore < 60 && "[&>div]:bg-red-500"
            )}
          />
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="font-semibold text-red-800">{totalErrors}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <div className="font-semibold text-orange-800">{totalWarnings}</div>
              <div className="text-sm text-orange-600">Warnings</div>
            </div>
          </div>
        </div>
        
        {/* Critical Issues */}
        {criticalIssues.length > 0 && (
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
        )}
        
        {/* Error Categorization by Fix Type */}
        <div className="space-y-4">
          <h4 className="font-medium">Fix Recommendations</h4>
          
          {/* Auto-fixable Errors */}
          {errorCategories.autoFixable.length > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Auto-fixable Issues</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {errorCategories.autoFixable.length}
                  </Badge>
                </div>
                <Button
                  onClick={autoFixSimpleErrors}
                  disabled={isAutoFixing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
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
              <p className="text-sm text-blue-700 mb-2">
                Simple formatting, data type, and default value issues that can be fixed automatically
              </p>
              {autoFixStatus === 'success' && autoFixResult && (
                <div className="space-y-1">
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    {autoFixResult.totalFixed} of {autoFixResult.totalAttempted} issues fixed
                  </Badge>
                  {autoFixResult.totalAttempted - autoFixResult.totalFixed > 0 && (
                    <div className="text-xs text-orange-600">
                      {autoFixResult.totalAttempted - autoFixResult.totalFixed} issues still need manual review
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Manual Review Required */}
          {errorCategories.manualReview.length > 0 && (
            <div className="border rounded-lg p-4 bg-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Manual Review Required</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {errorCategories.manualReview.length}
                </Badge>
              </div>
              <p className="text-sm text-orange-700">
                Complex issues that need your attention and decision-making
              </p>
            </div>
          )}
          
          {/* Business Decisions */}
          {errorCategories.businessDecisions.length > 0 && (
            <div className="border rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Business Decisions</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {errorCategories.businessDecisions.length}
                </Badge>
              </div>
              <p className="text-sm text-purple-700">
                Skill matching, hiring decisions, and business logic that requires human expertise
              </p>
            </div>
          )}
        </div>
        
        {/* Issues by Category */}
        <div className="space-y-3">
          <h4 className="font-medium">Issues by Category</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(errorsByCategory).map(([category, count]) => (
              <div 
                key={category}
                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {categoryIcons[category]}
                  <span className="text-sm">{categoryNames[category]}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Detailed Issues by Data Type */}
        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Issues</TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="h-3 w-3 mr-1" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="workers">
              <UserCheck className="h-3 w-3 mr-1" />
              Workers
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Briefcase className="h-3 w-3 mr-1" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-2 max-h-48 overflow-y-auto">
            {allErrors.map((error, index) => (
              <ValidationErrorItem 
                key={index} 
                error={error} 
                sessionId={sessionId}
                onJumpToError={onJumpToError}
                onFixApplied={onDataUpdated}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-2 max-h-48 overflow-y-auto">
            {allErrors
              .filter(error => error.dataType === 'clients')
              .map((error, index) => (
                <ValidationErrorItem 
                  key={index} 
                  error={error} 
                  sessionId={sessionId}
                  onJumpToError={onJumpToError}
                  onFixApplied={onDataUpdated}
                />
              ))
            }
          </TabsContent>
          
          <TabsContent value="workers" className="space-y-2 max-h-48 overflow-y-auto">
            {allErrors
              .filter(error => error.dataType === 'workers')
              .map((error, index) => (
                <ValidationErrorItem 
                  key={index} 
                  error={error} 
                  sessionId={sessionId}
                  onJumpToError={onJumpToError}
                  onFixApplied={onDataUpdated}
                />
              ))
            }
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-2 max-h-48 overflow-y-auto">
            {allErrors
              .filter(error => error.dataType === 'tasks')
              .map((error, index) => (
                <ValidationErrorItem 
                  key={index} 
                  error={error} 
                  sessionId={sessionId}
                  onJumpToError={onJumpToError}
                  onFixApplied={onDataUpdated}
                />
              ))
            }
          </TabsContent>
        </Tabs>
        
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

const ValidationErrorItem: React.FC<{
  error: ValidationError
  sessionId: string
  onJumpToError?: (error: ValidationError) => void
  onFixApplied?: () => void
}> = ({ error, sessionId, onJumpToError, onFixApplied }) => {
  const [isLoadingFix, setIsLoadingFix] = useState(false)
  const [fixSuggestion, setFixSuggestion] = useState<any>(null)
  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [fixStatus, setFixStatus] = useState<'none' | 'success' | 'error'>('none')
  const severityColors: Record<string, string> = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50',
    low: 'border-yellow-200 bg-yellow-50'
  }
  
  const typeIcons = {
    error: <XCircle className="h-4 w-4 text-red-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-orange-600" />
  }

  const getSuggestion = async () => {
    if (fixSuggestion || isLoadingFix) return
    
    setIsLoadingFix(true)
    try {
      const response = await fetch('/api/ai/suggest-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          error,
          context: {}
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setFixSuggestion(result.suggestion)
      } else {
        console.error('Failed to get fix suggestion')
      }
    } catch (error) {
      console.error('Error getting fix suggestion:', error)
    } finally {
      setIsLoadingFix(false)
    }
  }

  const applyFix = async (applyToAll = false) => {
    if (!fixSuggestion || isApplyingFix) return
    
    setIsApplyingFix(true)
    try {
      const response = await fetch('/api/ai/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          error,
          suggestedValue: fixSuggestion.suggestedValue,
          applyToAll
        })
      })
      
      if (response.ok) {
        setFixStatus('success')
        onFixApplied?.()
        setTimeout(() => setFixStatus('none'), 2000)
      } else {
        setFixStatus('error')
        setTimeout(() => setFixStatus('none'), 2000)
      }
    } catch (error) {
      console.error('Error applying fix:', error)
      setFixStatus('error')
      setTimeout(() => setFixStatus('none'), 2000)
    } finally {
      setIsApplyingFix(false)
    }
  }
  
  return (
    <div 
      className={cn(
        "p-3 border rounded-md transition-shadow",
        severityColors[error.severity],
        fixStatus === 'success' && "border-green-400 bg-green-50",
        fixStatus === 'error' && "border-red-400"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div 
          className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-80"
          onClick={() => onJumpToError?.(error)}
        >
          {typeIcons[error.type]}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">
              {error.message}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Row {error.row + 1}, Column: {error.column}
            </div>
            {error.suggestion && (
              <div className="text-xs text-blue-600 mt-1 italic">
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
          
          {/* AI Fix Buttons */}
          <div className="flex items-center gap-1 mt-1">
            {fixStatus === 'success' && (
              <Badge variant="default" className="text-xs bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Fixed
              </Badge>
            )}
            {fixStatus === 'error' && (
              <Badge variant="destructive" className="text-xs">
                <X className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            )}
            {fixStatus === 'none' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={getSuggestion}
                  disabled={isLoadingFix}
                >
                  {isLoadingFix ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                </Button>
                
                {fixSuggestion && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={() => applyFix(false)}
                      disabled={isApplyingFix}
                      title={`Apply fix: ${fixSuggestion.suggestedValue}`}
                    >
                      {isApplyingFix ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Fix'
                      )}
                    </Button>
                    {['required', 'datatype'].includes(error.category) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 px-2 text-xs"
                        onClick={() => applyFix(true)}
                        disabled={isApplyingFix}
                        title={`Apply to all similar: ${fixSuggestion.suggestedValue}`}
                      >
                        All
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Fix Suggestion Display */}
      {fixSuggestion && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1">
            🤖 AI Suggestion ({fixSuggestion.confidence} confidence):
          </div>
          <div className="text-blue-700 mb-1">
            <strong>Value:</strong> {JSON.stringify(fixSuggestion.suggestedValue)}
          </div>
          <div className="text-blue-600">
            {fixSuggestion.explanation}
          </div>
          {fixSuggestion.alternativeValues?.length > 0 && (
            <div className="text-blue-600 mt-1">
              <strong>Alternatives:</strong> {fixSuggestion.alternativeValues.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
