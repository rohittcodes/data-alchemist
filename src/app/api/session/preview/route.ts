import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'

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
    const sessionData = await SessionManager.createSession(sessionId)
    
    // Update with the data - convert it to the expected format
    const updates: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'clients' || key === 'workers' || key === 'tasks') {
        updates[key] = {
          data: value,
          headers: value && Array.isArray(value) && value.length > 0 ? Object.keys(value[0]) : [],
          rowCount: Array.isArray(value) ? value.length : 0
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
