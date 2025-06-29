import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'
import type { ParsedData, DataRow } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      )
    }

    // Create a temporary preview session
    const sessionId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create the session first
    await SessionManager.createSession(sessionId)
    
    // Update with the data - convert it to the expected format
    const updates: Record<string, ParsedData> = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'clients' || key === 'workers' || key === 'tasks') {
        const valueArray = value as DataRow[]
        updates[key] = {
          rows: valueArray,
          headers: valueArray && Array.isArray(valueArray) && valueArray.length > 0 ? Object.keys(valueArray[0]) : [],
          rowCount: Array.isArray(valueArray) ? valueArray.length : 0,
          fileName: `${key}.csv`,
          fileSize: 0
        }
      }
    }
    
    await SessionManager.updateSession(sessionId, updates)

    return NextResponse.json({ 
      sessionId,
      message: 'Preview session created successfully'
    })

  } catch (error) {
    console.error('Error creating preview session:', error)
    return NextResponse.json(
      { error: 'Failed to create preview session' },
      { status: 500 }
    )
  }
}
