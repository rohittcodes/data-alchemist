import { NextRequest, NextResponse } from 'next/server'
import kvStore from '@/lib/storage/kv-store'
import { ValidationError } from '@/lib'

interface ApplyFixRequest {
  sessionId: string
  error: ValidationError
  suggestedValue: any
  applyToAll?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, error, suggestedValue, applyToAll }: ApplyFixRequest = await req.json()

    if (!sessionId || !error || suggestedValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, error, and suggestedValue' },
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

    // Apply the fix
    const updatedData = { ...sessionData }
    const dataType = error.dataType
    const targetData = updatedData.data[dataType]

    if (!targetData || !Array.isArray(targetData)) {
      return NextResponse.json(
        { error: `No data found for type: ${dataType}` },
        { status: 400 }
      )
    }

    if (applyToAll && error.category === 'duplicate') {
      // For duplicate fixes, only apply to the specific row to avoid creating more duplicates
      if (error.row < targetData.length) {
        targetData[error.row][error.column] = suggestedValue
      }
    } else if (applyToAll) {
      // Apply to all rows with the same issue (for missing required fields, invalid data types, etc.)
      const originalValue = targetData[error.row]?.[error.column]
      
      targetData.forEach((row: any, index: number) => {
        if (row[error.column] === originalValue || 
            (originalValue == null && (row[error.column] == null || row[error.column] === ''))) {
          row[error.column] = suggestedValue
        }
      })
    } else {
      // Apply to single row
      if (error.row < targetData.length) {
        targetData[error.row][error.column] = suggestedValue
      }
    }

    // Update the session
    updatedData.data[dataType] = targetData
    updatedData.lastModified = new Date().toISOString()
    
    await kvStore.set(`session:${sessionId}`, updatedData)

    return NextResponse.json({ 
      success: true,
      updatedData: updatedData.data,
      affectedRows: applyToAll ? 
        targetData.filter((row: any) => row[error.column] === suggestedValue).length : 
        1
    })
  } catch (error) {
    console.error('Error applying fix:', error)
    return NextResponse.json(
      { error: 'Failed to apply fix' },
      { status: 500 }
    )
  }
}
