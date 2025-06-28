// Google AI service setup for Data Alchemist
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DataRow } from '../types'

// Initialize Google AI client with validation
const apiKey = process.env.GOOGLE_API_KEY || ''
if (!apiKey) {
  console.warn('Google AI API key not found. AI features will be disabled.')
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface AISearchRequest {
  query: string
  sessionId: string
  dataTypes?: ('clients' | 'workers' | 'tasks')[]
}

export interface AISearchResponse {
  filteredData: any
  filter: any
  explanation: string
  suggestedQueries?: string[]
}

export class GoogleAIService {
  private model = 'gemini-1.5-flash' // Use more stable model instead of gemini-2.0-flash-001

  /**
   * Generate content using Google AI
   */
  async generateContent(prompt: string): Promise<string> {
    if (!genAI) {
      throw new Error('Google AI is not configured. Please set GOOGLE_API_KEY in your environment.')
    }

    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Error generating content:', error)
      throw error
    }
  }

  /**
   * Convert natural language query to data filter
   */
  async generateDataFilter(
    query: string,
    availableFields: Record<string, string[]>,
    sampleData: Record<string, DataRow[]>
  ) {
    if (!genAI) {
      throw new Error('Google AI is not configured. Please set GOOGLE_API_KEY in your environment.')
    }

    const prompt = this.buildFilterPrompt(query, availableFields, sampleData)
    
    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Parse the JSON response
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = responseText.match(jsonPattern)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      
      // Fallback: try to parse the entire response as JSON
      return JSON.parse(responseText)
    } catch (error) {
      console.error('Error generating filter:', error)
      throw new Error('Failed to generate search filter from query')
    }
  }

  /**
   * Generate search suggestions based on data content
   */
  async generateSearchSuggestions(
    availableFields: Record<string, string[]>,
    sampleData: Record<string, DataRow[]>
  ): Promise<string[]> {
    if (!genAI) {
      console.warn('Google AI not configured, returning default suggestions')
      return [
        "Show high priority clients",
        "Find available workers", 
        "Tasks due soon",
        "Clients with no tasks",
        "Workers with specific skills"
      ]
    }

    const prompt = `
Based on this dataset structure, suggest 5 useful natural language search queries that users might want to ask:

Available Data:
${Object.entries(availableFields).map(([type, fields]) => 
  `${type.charAt(0).toUpperCase() + type.slice(1)}: ${fields.join(', ')}`
).join('\n')}

Sample Data:
${Object.entries(sampleData).map(([type, data]) => 
  `${type}: ${JSON.stringify(data.slice(0, 2), null, 2)}`
).join('\n\n')}

Return only a JSON array of 5 search query strings that would be useful for this data.
Example: ["Show high priority clients", "Find workers with JavaScript skills", "Tasks due this week"]
`

    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Try to extract JSON from code blocks first
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = responseText.match(jsonPattern)
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch (e) {
          console.warn('Failed to parse JSON from code block:', e)
        }
      }
      
      // Try to extract array pattern
      const arrayPattern = /\[[\s\S]*?\]/
      const arrayMatch = responseText.match(arrayPattern)
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0])
        } catch (e) {
          console.warn('Failed to parse array:', e)
        }
      }
      
      // Fallback: try parsing entire response
      try {
        return JSON.parse(responseText)
      } catch (e) {
        console.warn('Failed to parse entire response as JSON:', e)
        throw e
      }
    } catch (error) {
      console.error('Error generating suggestions, using fallback:', error)
      // Return fallback suggestions when AI fails
      return [
        "Show high priority clients",
        "Find available workers",
        "Tasks due this week", 
        "Workers with specific skills",
        "Projects by deadline",
        "High budget projects",
        "Recent tasks",
        "Available team members"
      ]
    }
  }

  /**
   * Explain search results in natural language
   */
  async explainResults(
    originalQuery: string,
    filter: any,
    resultCount: number
  ): Promise<string> {
    if (!genAI) {
      return `Found ${resultCount} results matching "${originalQuery}"`
    }

    const prompt = `
Explain in 1-2 sentences what this search found:

Original query: "${originalQuery}"
Applied filter: ${JSON.stringify(filter, null, 2)}
Results found: ${resultCount}

Be concise and user-friendly. Focus on what was found, not the technical filter details.
`

    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error('Error explaining results:', error)
      return `Found ${resultCount} results matching "${originalQuery}"`
    }
  }

  private buildFilterPrompt(
    query: string,
    availableFields: Record<string, string[]>,
    sampleData: Record<string, any[]>
  ): string {
    return `
You are a data filtering assistant. Convert the natural language query into a JSON filter object.

Query: "${query}"

Available Data Structure:
${Object.entries(availableFields).map(([type, fields]) => 
  `${type.charAt(0).toUpperCase() + type.slice(1)}: ${fields.join(', ')}`
).join('\n')}

Sample Data for Context:
${Object.entries(sampleData).map(([type, data]) => 
  `${type}: ${JSON.stringify(data.slice(0, 2), null, 2)}`
).join('\n\n')}

Rules:
1. Return valid JSON only, wrapped in \`\`\`json code blocks
2. Use exact field names from the available data structure
3. Support operators: equals, contains, gt (greater than), lt (less than), in (array)
4. For text searches, use "contains" with case-insensitive matching
5. For date ranges, use ISO date strings
6. For arrays (like skills), use "contains" or "in" operators

Filter Format:
{
  "dataType": "clients|workers|tasks",
  "conditions": [
    {
      "field": "fieldName",
      "operator": "equals|contains|gt|lt|in",
      "value": "searchValue"
    }
  ]
}

Examples:
- "high priority clients" → {"dataType": "clients", "conditions": [{"field": "priority", "operator": "equals", "value": "high"}]}
- "workers with javascript" → {"dataType": "workers", "conditions": [{"field": "skills", "operator": "contains", "value": "javascript"}]}
- "tasks due this week" → {"dataType": "tasks", "conditions": [{"field": "deadline", "operator": "lt", "value": "2025-07-04"}]}

\`\`\`json
`
  }

  /**
   * Intelligent column mapping for natural language queries
   * Handles synonyms, variations, and business context
   */
  async intelligentColumnMapping(
    query: string,
    availableFields: Record<string, string[]>,
    sampleData: Record<string, DataRow[]>
  ) {
    if (!genAI) {
      throw new Error('Google AI is not configured. Please set GOOGLE_API_KEY in your environment.')
    }

    const prompt = `
You are an intelligent data analyst. Analyze this natural language query and map it to the correct database columns with smart synonym handling.

Query: "${query}"

Available Fields by Data Type:
${Object.entries(availableFields).map(([type, fields]) => 
  `${type.charAt(0).toUpperCase() + type.slice(1)}: ${fields.join(', ')}`
).join('\n')}

Sample Data for Context:
${Object.entries(sampleData).map(([type, data]) => 
  `${type}: ${JSON.stringify(data.slice(0, 2), null, 2)}`
).join('\n\n')}

Your task:
1. Understand what the user is looking for using business context
2. Map query terms to correct column names (handle synonyms intelligently)
3. Handle variations: "company/client", "developer/worker", "hourly pay/rate", "urgent/high priority"
4. Create appropriate filter conditions with correct operators

Smart mapping examples:
- "high priority companies" → clients where priority = 1 (assuming 1 = highest)
- "expensive developers" → workers where rate > 90
- "React experts" → workers where skills contains "React" 
- "urgent tasks" → tasks where deadline is soon OR priority is high
- "TechCorp projects" → tasks where clientId matches TechCorp's client ID
- "JavaScript specialists" → workers where skills contains "JavaScript"

Return JSON in this exact format:
{
  "dataType": "clients|workers|tasks",
  "conditions": [
    {
      "field": "exact_field_name_from_available_fields",
      "operator": "equals|contains|gt|lt|in",
      "value": "search_value"
    }
  ],
  "reasoning": "Brief explanation of intelligent mapping decisions made",
  "confidence": "high|medium|low"
}
`

    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Parse JSON response
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = responseText.match(jsonPattern)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      
      return JSON.parse(responseText)
    } catch (error) {
      console.error('Error in intelligent column mapping:', error)
      throw new Error('Failed to map query to columns intelligently')
    }
  }

  /**
   * Generate smart query suggestions with business context
   */
  async generateSmartSuggestions(
    availableFields: Record<string, string[]>,
    sampleData: Record<string, DataRow[]>
  ): Promise<string[]> {
    if (!genAI) {
      return [
        "Show high priority companies",
        "Find React developers",
        "Expensive consultants over $90/hour", 
        "Tasks due this week",
        "Healthcare industry clients",
        "Full-stack specialists",
        "Urgent projects",
        "Premium enterprise clients"
      ]
    }

    const prompt = `
Based on this dataset, suggest 8 diverse natural language queries that demonstrate intelligent business context understanding.

Available Data:
${Object.entries(availableFields).map(([type, fields]) => 
  `${type}: ${fields.join(', ')}`
).join('\n')}

Sample Data Context:
${Object.entries(sampleData).map(([type, data]) => 
  `${type}: ${JSON.stringify(data.slice(0, 2), null, 2)}`
).join('\n\n')}

Create business-focused queries using:
1. Industry terminology ("companies" instead of "clients", "developers" instead of "workers")
2. Descriptive qualifiers ("expensive", "urgent", "expert", "senior", "enterprise")
3. Technical skills ("React specialists", "full-stack developers", "JavaScript experts")
4. Business context ("high-value clients", "complex projects", "urgent deadlines")
5. Comparative terms ("top-rated", "most experienced", "largest projects")

Return only a JSON array of 8 natural query strings:
["query1", "query2", ...]
`

    try {
      const model = genAI.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Try to extract JSON from code blocks first
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = responseText.match(jsonPattern)
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch (e) {
          console.warn('Failed to parse JSON from code block:', e)
        }
      }
      
      // Try to extract array pattern
      const arrayPattern = /\[[\s\S]*?\]/
      const arrayMatch = responseText.match(arrayPattern)
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0])
        } catch (e) {
          console.warn('Failed to parse array:', e)
        }
      }
      
      // Fallback: try parsing entire response
      try {
        return JSON.parse(responseText)
      } catch (e) {
        console.warn('Failed to parse entire response as JSON:', e)
        throw e
      }
    } catch (error) {
      console.error('Error generating smart suggestions:', error)
      return [
        "Show high priority companies",
        "Find React experts",
        "Expensive developers over $90/hour",
        "Urgent deadlines this month",
        "Enterprise clients",
        "Full-stack specialists", 
        "Healthcare industry projects",
        "Complex technical requirements"
      ]
    }
  }
}

export const googleAIService = new GoogleAIService()

/**
 * Check if Google AI service is available and working
 */
export async function checkAIServiceStatus(): Promise<boolean> {
  if (!genAI) {
    return false
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent('Test connection')
    await result.response
    return true
  } catch (error) {
    console.warn('AI service check failed:', error)
    return false
  }
}

/**
 * Get offline fallback suggestions when AI is unavailable
 */
export function getOfflineFallbacks() {
  return {
    suggestions: [
      "Show high priority items",
      "Find available resources", 
      "Filter by status",
      "Search by category",
      "Sort by date",
      "Recent entries",
      "Active projects",
      "Available team members"
    ],
    explanation: "AI services temporarily unavailable. Using basic filtering.",
    searchTips: [
      "Use specific keywords like 'high', 'available', 'urgent'",
      "Try filtering by status, priority, or date ranges",
      "Search for skill names like 'React', 'Python', 'JavaScript'"
    ]
  }
}
