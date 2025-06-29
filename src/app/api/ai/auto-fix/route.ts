import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'
import { applyAutoFixes, type AutoFixSummary } from '@/lib/validators/auto-fix'
import type { ValidationError } from '@/lib/validators/types'
import type { ParsedData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, errors } = await request.json()
    
    console.log('Auto-fix API called with:', { sessionId, errorCount: errors?.length })
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: 'Errors array is required' },
        { status: 400 }
      )
    }
    
    console.log('Received errors for auto-fix:', errors.map(e => ({ 
      category: e.category, 
      severity: e.severity, 
      dataType: e.dataType, 
      row: e.row, 
      column: e.column, 
      message: e.message 
    })))
    
    // Get session data
    const sessionData = await SessionManager.getSession(sessionId)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    console.log('Session data retrieved, has data types:', Object.keys(sessionData))
    
    // Apply auto-fixes to each data type
    const results: Record<string, AutoFixSummary> = {}
    
    let totalFixed = 0
    let totalRequireManual = 0
    
    // Group errors by data type
    const errorsByType = {
      clients: errors.filter((e: ValidationError) => e.dataType === 'clients'),
      workers: errors.filter((e: ValidationError) => e.dataType === 'workers'),
      tasks: errors.filter((e: ValidationError) => e.dataType === 'tasks')
    }
    
    console.log('Errors grouped by type:', {
      clients: errorsByType.clients.length,
      workers: errorsByType.workers.length,
      tasks: errorsByType.tasks.length
    })
    
    // Apply fixes for each data type
    for (const [dataType, typeErrors] of Object.entries(errorsByType)) {
      if (typeErrors.length === 0) continue
      
      console.log(`Processing ${typeErrors.length} errors for ${dataType}`)
      
      const data = sessionData[dataType as keyof typeof sessionData] as ParsedData
      if (!data?.rows) {
        console.log(`No data found for ${dataType}`)
        continue
      }
      
      console.log(`Data found for ${dataType}: ${data.rows.length} rows`)
      
      const fixResult = applyAutoFixes(data.rows, typeErrors)
      results[dataType] = fixResult
      
      console.log(`Auto-fix result for ${dataType}:`, fixResult)
      
      totalFixed += fixResult.totalFixed
      totalRequireManual += fixResult.totalRequireManual
    }
    
    console.log(`Total fixed: ${totalFixed}, Total requiring manual: ${totalRequireManual}`)
    
    // Save updated session data if any fixes were applied
    if (totalFixed > 0) {
      console.log('Saving updated session data...')
      await SessionManager.updateSession(sessionId, sessionData)
      console.log('Session data saved successfully')
    } else {
      console.log('No fixes applied, skipping session update')
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalFixed,
        totalRequireManual,
        totalAttempted: errors.length
      },
      details: results,
      message: totalFixed > 0 
        ? `Successfully auto-fixed ${totalFixed} issues. ${totalRequireManual} require manual review.`
        : 'No issues could be automatically fixed. Manual review required.'
    })
    
  } catch (error) {
    console.error('Auto-fix API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
