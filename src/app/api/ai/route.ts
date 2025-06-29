import { NextRequest, NextResponse } from 'next/server'
import { SessionManager, type SessionData } from '@/lib/storage'
import { googleAIService, getOfflineFallbacks } from '@/lib/ai/google-ai-service'
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

async function handleSearch(query: string, sessionData: SessionData) {
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
    
    console.log('Generated filter:', JSON.stringify(filter, null, 2))
    console.log('Available fields:', availableFields)
    
    // Apply filter to data
    const filteredResults = applyDataFilter(sessionData, filter)
    
    console.log('API returning filtered results:', {
      totalResults: filteredResults.totalResults,
      breakdown: {
        clients: filteredResults.clients?.length || 0,
        workers: filteredResults.workers?.length || 0,
        tasks: filteredResults.tasks?.length || 0
      }
    })
    
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
      filteredData: {
        clients: filteredResults.clients,
        workers: filteredResults.workers,
        tasks: filteredResults.tasks
      },
      filter,
      explanation,
      suggestedQueries,
      query,
      totalResults: filteredResults.totalResults,
      summary: {
        totalFound: filteredResults.totalResults,
        breakdown: {
          clients: filteredResults.clients?.length || 0,
          workers: filteredResults.workers?.length || 0,
          tasks: filteredResults.tasks?.length || 0
        }
      }
    })
    
  } catch (error) {
    console.error('Search error:', error)
    
    // Use enhanced offline fallbacks when AI service is unavailable
    const availableFields = getAvailableFields(sessionData)
    const fallbackData = getOfflineFallbacks()
    const contextualSuggestions = buildContextualSuggestions(availableFields)
    
    // Combine AI fallbacks with contextual suggestions
    const allSuggestions = [...fallbackData.suggestions, ...contextualSuggestions]
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 8)
    
    return NextResponse.json({
      error: 'AI search temporarily unavailable',
      explanation: fallbackData.explanation,
      suggestedQueries: uniqueSuggestions,
      searchTips: fallbackData.searchTips,
      fallback: true
    }, { status: 500 })
  }
}

async function handleSuggestions(sessionData: SessionData) {
  try {
    const availableFields = getAvailableFields(sessionData)
    const sampleData = getSampleData(sessionData)
    
    // Get AI-generated suggestions
    const aiSuggestions = await googleAIService.generateSearchSuggestions(
      availableFields,
      sampleData
    )
    
    // Get contextual suggestions as fallback
    const contextualSuggestions = buildContextualSuggestions(availableFields)
    
    // Combine and deduplicate
    const allSuggestions = [...new Set([...aiSuggestions, ...contextualSuggestions])]
    
    return NextResponse.json({
      suggestions: allSuggestions.slice(0, 10),
      availableFields,
      dataTypes: Object.keys(availableFields)
    })
    
  } catch (error) {
    console.error('Suggestions error:', error)
    
    // Enhanced fallback when AI service is unavailable
    const availableFields = getAvailableFields(sessionData)
    const fallbackData = getOfflineFallbacks()
    const contextualSuggestions = buildContextualSuggestions(availableFields)
    
    // Combine offline suggestions with contextual ones
    const allSuggestions = [...fallbackData.suggestions, ...contextualSuggestions]
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 10)
    
    return NextResponse.json({
      suggestions: uniqueSuggestions,
      availableFields,
      dataTypes: Object.keys(availableFields),
      explanation: fallbackData.explanation,
      searchTips: fallbackData.searchTips,
      fallback: true
    })
  }
}