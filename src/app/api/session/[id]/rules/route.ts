import { NextRequest, NextResponse } from 'next/server'
import kvStore from '@/lib/storage/kv-store'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Load session data
    const sessionData = await kvStore.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Return rules (empty array if none exist)
    const rules = sessionData.rules || []
    
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error getting rules:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve rules' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const { rule } = await req.json()
    
    if (!sessionId || !rule) {
      return NextResponse.json(
        { error: 'Session ID and rule are required' },
        { status: 400 }
      )
    }

    // Load session data
    const sessionData = await kvStore.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Add rule to session
    const rules = sessionData.rules || []
    rules.push(rule)
    
    // Update session with new rules
    const updatedSession = {
      ...sessionData,
      rules,
      lastModified: Date.now()
    }
    
    await kvStore.set(`session:${sessionId}`, updatedSession)
    
    return NextResponse.json({ 
      success: true, 
      rule,
      totalRules: rules.length 
    })
  } catch (error) {
    console.error('Error saving rule:', error)
    return NextResponse.json(
      { error: 'Failed to save rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const { ruleId } = await req.json()
    
    if (!sessionId || !ruleId) {
      return NextResponse.json(
        { error: 'Session ID and rule ID are required' },
        { status: 400 }
      )
    }

    // Load session data
    const sessionData = await kvStore.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Remove rule from session
    const rules = (sessionData.rules || []).filter((rule: any) => rule.id !== ruleId)
    
    // Update session
    const updatedSession = {
      ...sessionData,
      rules,
      lastModified: Date.now()
    }
    
    await kvStore.set(`session:${sessionId}`, updatedSession)
    
    return NextResponse.json({ 
      success: true, 
      totalRules: rules.length 
    })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
}
