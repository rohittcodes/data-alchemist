import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'
import { validateData } from '@/lib/validators'
import type { ParsedData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, data } = await request.json()
    
    console.log('Validation API called with:', { sessionId, hasData: !!data })
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get session data
    const sessionData = await SessionManager.getSession(sessionId)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    console.log('Session data retrieved, data types available:', Object.keys(sessionData))
    
    // Extract data for validation
    let clientsData: ParsedData | undefined
    let workersData: ParsedData | undefined
    let tasksData: ParsedData | undefined
    
    if (data) {
      // Use provided data (from request)
      clientsData = data.clients ? {
        headers: Object.keys(data.clients[0] || {}),
        rows: data.clients,
        rowCount: data.clients.length,
        fileName: 'clients.csv',
        fileSize: 0
      } : undefined
      
      workersData = data.workers ? {
        headers: Object.keys(data.workers[0] || {}),
        rows: data.workers,
        rowCount: data.workers.length,
        fileName: 'workers.csv',
        fileSize: 0
      } : undefined
      
      tasksData = data.tasks ? {
        headers: Object.keys(data.tasks[0] || {}),
        rows: data.tasks,
        rowCount: data.tasks.length,
        fileName: 'tasks.csv',
        fileSize: 0
      } : undefined
    } else {
      // Use session data
      clientsData = sessionData.clients
      workersData = sessionData.workers
      tasksData = sessionData.tasks
    }
    
    console.log('Data prepared for validation:', {
      clients: clientsData ? `${clientsData.rowCount} rows` : 'none',
      workers: workersData ? `${workersData.rowCount} rows` : 'none',
      tasks: tasksData ? `${tasksData.rowCount} rows` : 'none'
    })
    
    // Run validation
    const validation = validateData(clientsData, workersData, tasksData)
    
    console.log('Validation completed:', {
      totalErrors: validation.totalErrors,
      totalWarnings: validation.totalWarnings,
      categoriesWithIssues: Object.keys(validation.errorsByCategory)
    })
    
    // Store validation results in session
    const updatedSessionData = {
      ...sessionData,
      validationSummary: validation,
      lastModified: Date.now()
    }
    
    await SessionManager.updateSession(sessionId, updatedSessionData)
    
    return NextResponse.json(validation)
    
  } catch (error) {
    console.error('Validation API error:', error)
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
