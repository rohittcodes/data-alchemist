import { NextRequest, NextResponse } from 'next/server'
import { SessionManager } from '@/lib/storage'
import { googleAIService } from '@/lib/ai/google-ai-service'
import { applyDataFilter, getAvailableFields, getSampleData, buildContextualSuggestions } from '@/lib/ai/data-filter'

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId, action = 'search' } = await request.json()
    
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
    
    // Handle different AI actions
    switch (action) {
      case 'search':
        return await handleSearch(query, sessionData)
      case 'suggestions':
        return await handleSuggestions(sessionData)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleSearch(query: string, sessionData: any) {
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }
  
  try {
    // Get data structure for AI context
    const availableFields = getAvailableFields(sessionData)
    const sampleData = getSampleData(sessionData)
    
    // Generate filter using Google AI
    const filter = await googleAIService.generateDataFilter(
      query,
      availableFields,
      sampleData
    )
    
    // Apply filter to data
    const filteredResults = applyDataFilter(sessionData, filter)
    
    // Generate explanation
    const explanation = await googleAIService.explainResults(
      query,
      filter,
      filteredResults.totalResults
    )
    
    // Generate related suggestions if no results
    let suggestedQueries: string[] = []
    if (filteredResults.totalResults === 0) {
      suggestedQueries = await googleAIService.generateSearchSuggestions(
        availableFields,
        sampleData
      )
    }
    
    return NextResponse.json({
      filteredData: filteredResults,
      filter,
      explanation,
      suggestedQueries,
      query,
      totalResults: filteredResults.totalResults
    })
    
  } catch (error) {
    console.error('Search error:', error)
    
    // Fallback to contextual suggestions
    const availableFields = getAvailableFields(sessionData)
    const sampleData = getSampleData(sessionData)
    const fallbackSuggestions = buildContextualSuggestions(availableFields, sampleData)
    
    return NextResponse.json({
      error: 'Failed to process search query',
      suggestedQueries: fallbackSuggestions,
      fallback: true
    }, { status: 500 })
  }
}

async function handleSuggestions(sessionData: any) {
  try {
    const availableFields = getAvailableFields(sessionData)
    const sampleData = getSampleData(sessionData)
    
    // Get AI-generated suggestions
    const aiSuggestions = await googleAIService.generateSearchSuggestions(
      availableFields,
      sampleData
    )
    
    // Get contextual suggestions as fallback
    const contextualSuggestions = buildContextualSuggestions(availableFields, sampleData)
    
    // Combine and deduplicate
    const allSuggestions = [...new Set([...aiSuggestions, ...contextualSuggestions])]
    
    return NextResponse.json({
      suggestions: allSuggestions.slice(0, 10),
      availableFields,
      dataTypes: Object.keys(availableFields)
    })
    
  } catch (error) {
    console.error('Suggestions error:', error)
    
    // Fallback to contextual suggestions only
    const availableFields = getAvailableFields(sessionData)
    const sampleData = getSampleData(sessionData)
    const fallbackSuggestions = buildContextualSuggestions(availableFields, sampleData)
    
    return NextResponse.json({
      suggestions: fallbackSuggestions,
      availableFields,
      dataTypes: Object.keys(availableFields),
      fallback: true
    })
  }
}