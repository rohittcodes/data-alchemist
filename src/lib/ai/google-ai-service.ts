// Google AI service setup for Data Alchemist
import { GoogleGenAI } from '@google/genai'

// Initialize Google AI client
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

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
  private model = 'gemini-2.0-flash-001'

  /**
   * Generate content using Google AI
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await genAI.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: prompt }] }]
      })

      return result.text || ''
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
    sampleData: Record<string, any[]>
  ) {
    const prompt = this.buildFilterPrompt(query, availableFields, sampleData)
    
    try {
      const result = await genAI.models.generateContent({
        model: this.model,
        contents: prompt
      })
      
      const response = result.text || ''
      
      // Parse the JSON response
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = response.match(jsonPattern)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      
      // Fallback: try to parse the entire response as JSON
      return JSON.parse(response)
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
    sampleData: Record<string, any[]>
  ): Promise<string[]> {
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
      const result = await genAI.models.generateContent({
        model: this.model,
        contents: prompt
      })
      
      const response = result.text || ''
      
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const arrayPattern = /\[([\s\S]*?)\]/
      const jsonMatch = response.match(jsonPattern) || response.match(arrayPattern)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return [
        "Show high priority clients",
        "Find available workers",
        "Tasks due soon", 
        "Clients with no tasks",
        "Workers with specific skills"
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
    const prompt = `
Explain in 1-2 sentences what this search found:

Original query: "${originalQuery}"
Applied filter: ${JSON.stringify(filter, null, 2)}
Results found: ${resultCount}

Be concise and user-friendly. Focus on what was found, not the technical filter details.
`

    try {
      const result = await genAI.models.generateContent({
        model: this.model,
        contents: prompt
      })
      
      return (result.text || '').trim()
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
}

export const googleAIService = new GoogleAIService()
