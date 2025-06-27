import { NextRequest, NextResponse } from 'next/server'
import { GoogleAIService } from '@/lib/ai/google-ai-service'
import kvStore from '@/lib/storage/kv-store'
import type { ValidationError, DataRow } from '@/lib'

interface SuggestFixRequest {
  sessionId: string
  error: ValidationError
  context?: {
    currentValue?: string | number | boolean | null
    relatedData?: DataRow[]
    fieldOptions?: string[]
  }
}

interface FixSuggestion {
  suggestedValue: string | number | boolean | null
  confidence: 'high' | 'medium' | 'low'
  explanation: string
  isAutomatable: boolean
  alternativeValues?: (string | number | boolean | null)[]
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, error, context }: SuggestFixRequest = await req.json()

    if (!sessionId || !error) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and error' },
        { status: 400 }
      )
    }

    // Load session data for context
    const sessionData = await kvStore.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const aiService = new GoogleAIService()
    
    // Generate AI suggestion for fixing the error
    const suggestion = await generateFixSuggestion(aiService, error, sessionData, context)
    
    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Error generating fix suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to generate fix suggestion' },
      { status: 500 }
    )
  }
}

async function generateFixSuggestion(
  aiService: GoogleAIService,
  error: ValidationError,
  sessionData: any,
  context?: SuggestFixRequest['context']
): Promise<FixSuggestion> {
  const data = sessionData.data
  const errorRow = data[error.dataType]?.[error.row]
  
  // Build context for AI
  const contextInfo = {
    dataType: error.dataType,
    column: error.column,
    currentValue: errorRow?.[error.column],
    errorCategory: error.category,
    errorMessage: error.message,
    severity: error.severity,
    rowData: errorRow,
    ...context
  }

  // Get sample data for context (first 5 rows of the same type)
  const sampleData = data[error.dataType]?.slice(0, 5) || []
  
  // Get unique values for the column to help with suggestions
  const columnValues = data[error.dataType]
    ?.map((row: any) => row[error.column])
    .filter((val: any) => val != null && val !== '')
    .slice(0, 20) || []

  const uniqueValues = [...new Set(columnValues)]

  const prompt = buildFixSuggestionPrompt(contextInfo, sampleData, uniqueValues, data)
  
  try {
    const response = await aiService.generateContent(prompt)
    return parseFixSuggestion(response)
  } catch (aiError) {
    console.error('AI service error:', aiError)
    
    // Fallback to rule-based suggestions
    return generateRuleBasedSuggestion(error, contextInfo, uniqueValues)
  }
}

function buildFixSuggestionPrompt(
  contextInfo: any,
  sampleData: any[],
  uniqueValues: any[],
  allData: any
): string {
  return `You are a data quality expert. Analyze this validation error and suggest the best fix:

ERROR DETAILS:
- Data Type: ${contextInfo.dataType}
- Column: ${contextInfo.column}
- Current Value: "${contextInfo.currentValue}"
- Error Category: ${contextInfo.errorCategory}
- Error Message: ${contextInfo.errorMessage}
- Severity: ${contextInfo.severity}

ROW CONTEXT:
${JSON.stringify(contextInfo.rowData, null, 2)}

SAMPLE DATA (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

EXISTING VALUES IN COLUMN "${contextInfo.column}":
${uniqueValues.slice(0, 10).map(val => `"${val}"`).join(', ')}

AVAILABLE DATA TYPES:
${Object.keys(allData).join(', ')}

Based on the error type and context, suggest the best fix. Consider:

1. For DUPLICATE errors: Suggest unique identifiers or merging strategies
2. For REQUIRED errors: Suggest appropriate default values or data sources
3. For REFERENCE errors: Find valid reference values from related data
4. For DATATYPE errors: Convert to correct format while preserving meaning
5. For SKILL errors: Suggest skill classifications or mappings
6. For BUSINESS errors: Apply business rules and constraints

Respond with a JSON object in this exact format:
{
  "suggestedValue": "the suggested replacement value",
  "confidence": "high|medium|low",
  "explanation": "clear explanation of why this fix is recommended",
  "isAutomatable": true|false,
  "alternativeValues": ["alternative1", "alternative2", "alternative3"]
}

Ensure the JSON is valid and parseable. Make suggestions practical and data-aware.`
}

function parseFixSuggestion(aiResponse: string): FixSuggestion {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      suggestedValue: parsed.suggestedValue,
      confidence: parsed.confidence || 'medium',
      explanation: parsed.explanation || 'AI suggested fix',
      isAutomatable: parsed.isAutomatable !== false,
      alternativeValues: parsed.alternativeValues || []
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    
    // Extract any suggestions from free text
    const suggestion = aiResponse.includes('suggest') 
      ? aiResponse.split('suggest')[1]?.split('.')[0]?.trim()
      : 'Please review and correct manually'
    
    return {
      suggestedValue: suggestion,
      confidence: 'low',
      explanation: 'Failed to parse AI suggestion, manual review recommended',
      isAutomatable: false,
      alternativeValues: []
    }
  }
}

function generateRuleBasedSuggestion(
  error: ValidationError,
  contextInfo: any,
  uniqueValues: any[]
): FixSuggestion {
  const { category, column } = error
  const currentValue = contextInfo.currentValue
  
  switch (category) {
    case 'required':
      return {
        suggestedValue: getDefaultValue(column),
        confidence: 'medium',
        explanation: 'Suggested default value for required field',
        isAutomatable: true,
        alternativeValues: ['TBD', 'N/A', 'Unknown']
      }
      
    case 'duplicate':
      const baseValue = currentValue || 'ID'
      const suffix = Math.random().toString(36).substr(2, 4)
      return {
        suggestedValue: `${baseValue}_${suffix}`,
        confidence: 'high',
        explanation: 'Added unique suffix to resolve duplicate',
        isAutomatable: true,
        alternativeValues: [
          `${baseValue}_${Date.now()}`,
          `${baseValue}_copy`,
          `${baseValue}_v2`
        ]
      }
      
    case 'reference':
      const validRefs = uniqueValues.filter(val => val && val.toString().trim())
      return {
        suggestedValue: validRefs[0] || 'REF001',
        confidence: 'medium',
        explanation: 'Suggested valid reference from existing data',
        isAutomatable: false,
        alternativeValues: validRefs.slice(0, 3)
      }
      
    case 'datatype':
      return {
        suggestedValue: convertDataType(currentValue, column),
        confidence: 'medium',
        explanation: 'Converted to expected data type',
        isAutomatable: true,
        alternativeValues: []
      }
      
    default:
      return {
        suggestedValue: currentValue,
        confidence: 'low',
        explanation: 'Manual review recommended',
        isAutomatable: false,
        alternativeValues: []
      }
  }
}

function getDefaultValue(column: string): any {
  const lowerColumn = column.toLowerCase()
  
  if (lowerColumn.includes('id')) return 'AUTO_ID'
  if (lowerColumn.includes('name')) return 'Unknown'
  if (lowerColumn.includes('email')) return 'no-email@example.com'
  if (lowerColumn.includes('phone')) return '000-000-0000'
  if (lowerColumn.includes('date')) return new Date().toISOString().split('T')[0]
  if (lowerColumn.includes('skill')) return 'General'
  if (lowerColumn.includes('rate') || lowerColumn.includes('price')) return 0
  if (lowerColumn.includes('status')) return 'Active'
  
  return 'TBD'
}

function convertDataType(value: any, column: string): any {
  if (value == null) return null
  
  const lowerColumn = column.toLowerCase()
  const strValue = value.toString().trim()
  
  if (lowerColumn.includes('date')) {
    const date = new Date(strValue)
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
  }
  
  if (lowerColumn.includes('rate') || lowerColumn.includes('price') || lowerColumn.includes('cost')) {
    const num = parseFloat(strValue.replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? 0 : num
  }
  
  if (lowerColumn.includes('email')) {
    return strValue.includes('@') ? strValue : `${strValue}@example.com`
  }
  
  return strValue
}
