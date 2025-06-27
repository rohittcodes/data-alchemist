import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'
import { ParsedData } from '@/lib'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, rowIndex, columnId, value } = body

    if (!type || typeof rowIndex !== 'number' || !columnId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, rowIndex, columnId' },
        { status: 400 }
      )
    }

    // Get current session data
    const sessionData = await SessionManager.getSession(sessionId)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate data type
    if (!['clients', 'workers', 'tasks'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid data type' },
        { status: 400 }
      )
    }

    // Check if the data exists
    const dataSection = sessionData[type as 'clients' | 'workers' | 'tasks'] as ParsedData | undefined
    if (!dataSection || !dataSection.rows || !dataSection.rows[rowIndex]) {
      return NextResponse.json(
        { error: 'Row not found' },
        { status: 404 }
      )
    }

    // Update the specific cell
    const updatedSessionData = { ...sessionData }
    const targetData = updatedSessionData[type as 'clients' | 'workers' | 'tasks'] as ParsedData
    if (targetData?.rows?.[rowIndex]) {
      targetData.rows[rowIndex][columnId] = value
    }

    // Save back to session
    await SessionManager.updateSession(sessionId, updatedSessionData)

    return NextResponse.json({
      success: true,
      message: 'Cell updated successfully'
    })
  } catch (error) {
    console.error('Cell update error:', error)
    return NextResponse.json(
      { error: 'Failed to update cell' },
      { status: 500 }
    )
  }
}
