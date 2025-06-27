import { NextRequest, NextResponse } from 'next/server'
import kvStore from '@/lib/storage/kv-store'
import type { ValidationError, DataRow } from '@/lib'

interface ApplyFixRequest {
  sessionId: string
  error: ValidationError
  suggestedValue: string | number | boolean | null
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
    
    // Get the target parsed data
    const parsedData = updatedData[dataType]
    if (!parsedData || !parsedData.rows || !Array.isArray(parsedData.rows)) {
      return NextResponse.json(
        { error: `No data found for type: ${dataType}` },
        { status: 400 }
      )
    }

    const targetData = parsedData.rows

    if (applyToAll && error.category === 'duplicate') {
      // For duplicate fixes, only apply to the specific row to avoid creating more duplicates
      if (error.row < targetData.length) {
        targetData[error.row][error.column] = suggestedValue
      }
    } else if (applyToAll) {
      // Apply to all rows with the same issue (for missing required fields, invalid data types, etc.)
      const originalValue = targetData[error.row]?.[error.column]
      
      targetData.forEach((row: DataRow) => {
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

    // Update the session data
    if (updatedData[dataType]) {
      updatedData[dataType]!.rows = targetData
    }
    updatedData.lastModified = Date.now()
    
    await kvStore.set(`session:${sessionId}`, updatedData)

    return NextResponse.json({ 
      success: true,
      updatedData: {
        [dataType]: targetData
      },
      affectedRows: applyToAll ? 
        targetData.filter((row: DataRow) => row[error.column] === suggestedValue).length : 
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
