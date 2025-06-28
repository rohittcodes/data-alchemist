// Data filtering utilities for AI-powered search
import type { ParsedData, DataRow } from '../types'

export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in' | 'gte' | 'lte'
  value: any
}

export interface DataFilter {
  dataType: 'clients' | 'workers' | 'tasks'
  conditions: FilterCondition[]
}

export interface FilteredResults {
  clients?: any[]
  workers?: any[]
  tasks?: any[]
  totalResults: number
}

export interface IntelligentFilter extends DataFilter {
  reasoning?: string
  confidence?: 'high' | 'medium' | 'low'
  originalQuery?: string
}

/**
 * Enhanced column name mappings for intelligent filtering
 */
const INTELLIGENT_FIELD_MAPPINGS: Record<string, Record<string, string[]>> = {
  clients: {
    'clientId': ['clientid', 'client_id', 'CustomerID', 'customer_id', 'company_id', 'id'],
    'clientName': ['clientname', 'client_name', 'company_name', 'customer_name', 'name'],
    'requirements': ['requirements', 'description', 'project_description', 'needs'],
    'priority': ['priority', 'urgency', 'importance', 'level']
  },
  workers: {
    'workerId': ['workerid', 'worker_id', 'employee_id', 'staff_id', 'id'],
    'skills': ['skills', 'technologies', 'expertise', 'competencies', 'abilities'],
    'availability': ['availability', 'schedule', 'working_hours', 'hours'],
    'rate': ['rate', 'hourly_rate', 'salary', 'cost', 'price', 'wage', 'pay']
  },
  tasks: {
    'taskId': ['taskid', 'task_id', 'project_id', 'job_id', 'id'],
    'duration': ['duration', 'hours', 'estimated_hours', 'time_required'],
    'deadline': ['deadline', 'due_date', 'end_date', 'completion_date'],
    'skills': ['skills', 'technologies', 'requirements', 'tech_stack']
  }
}

/**
 * Map field name variations to canonical field names
 */
export function mapFieldName(dataType: string, fieldName: string): string {
  const mappings = INTELLIGENT_FIELD_MAPPINGS[dataType]
  if (!mappings) return fieldName

  const normalizedInput = fieldName.toLowerCase().trim()
  
  for (const [canonical, variations] of Object.entries(mappings)) {
    if (variations.includes(normalizedInput) || canonical.toLowerCase() === normalizedInput) {
      return canonical
    }
  }
  
  return fieldName
}

/**
 * Apply AI-generated filter with intelligent field mapping
 */
export function applyIntelligentFilter(
  sessionData: {
    clients?: ParsedData
    workers?: ParsedData
    tasks?: ParsedData
  },
  filter: IntelligentFilter
): FilteredResults {
  const results: FilteredResults = { totalResults: 0 }
  
  // Get the target dataset
  const targetData = sessionData[filter.dataType]
  if (!targetData || !targetData.rows) {
    return results
  }
  
  // Apply filters with intelligent field mapping
  const filteredRows = targetData.rows.filter((row: DataRow) => 
    filter.conditions.every(condition => {
      // Try original field name first
      if (row[condition.field] !== undefined) {
        return matchesCondition(row, condition)
      }
      
      // Try mapped field names
      const mappedField = mapFieldName(filter.dataType, condition.field)
      if (row[mappedField] !== undefined) {
        const mappedCondition = { ...condition, field: mappedField }
        return matchesCondition(row, mappedCondition)
      }
      
      // Try case-insensitive field matching
      const availableFields = Object.keys(row)
      const matchingField = availableFields.find(field => 
        field.toLowerCase() === condition.field.toLowerCase()
      )
      
      if (matchingField) {
        const caseInsensitiveCondition = { ...condition, field: matchingField }
        return matchesCondition(row, caseInsensitiveCondition)
      }
      
      return false
    })
  )
  
  results[filter.dataType] = filteredRows
  results.totalResults = filteredRows.length
  
  return results
}

/**
 * Apply AI-generated filter to session data
 */
export function applyDataFilter(
  sessionData: {
    clients?: ParsedData
    workers?: ParsedData
    tasks?: ParsedData
  },
  filter: DataFilter
): FilteredResults {
  const results: FilteredResults = { totalResults: 0 }
  
  // Get the target dataset
  const targetData = sessionData[filter.dataType]
  if (!targetData || !targetData.rows) {
    console.log(`No data found for ${filter.dataType}`)
    return results
  }
  
  console.log(`Filtering ${filter.dataType}:`, {
    originalCount: targetData.rows.length,
    conditions: filter.conditions,
    sampleRow: targetData.rows[0],
    availableFields: Object.keys(targetData.rows[0] || {})
  })
  
  // Apply filters with intelligent field mapping
  const filteredRows = targetData.rows.filter((row: DataRow) => 
    filter.conditions.every(condition => {
      // Try original field name first
      if (row[condition.field] !== undefined) {
        return matchesCondition(row, condition)
      }
      
      // Try mapped field names
      const mappedField = mapFieldName(filter.dataType, condition.field)
      if (row[mappedField] !== undefined) {
        const mappedCondition = { ...condition, field: mappedField }
        return matchesCondition(row, mappedCondition)
      }
      
      // Try case-insensitive field matching
      const availableFields = Object.keys(row)
      const matchingField = availableFields.find(field => 
        field.toLowerCase() === condition.field.toLowerCase()
      )
      
      if (matchingField) {
        const caseInsensitiveCondition = { ...condition, field: matchingField }
        return matchesCondition(row, caseInsensitiveCondition)
      }
      
      console.log(`Field '${condition.field}' not found in row. Available fields:`, Object.keys(row))
      return false
    })
  )
  
  console.log(`Filtering result: ${filteredRows.length}/${targetData.rows.length} rows match`)
  
  results[filter.dataType] = filteredRows
  results.totalResults = filteredRows.length
  
  return results
}

/**
 * Check if a data row matches a filter condition
 */
function matchesCondition(row: any, condition: FilterCondition): boolean {
  const fieldValue = row[condition.field]
  const searchValue = condition.value
  
  if (fieldValue === undefined || fieldValue === null) {
    return false
  }
  
  switch (condition.operator) {
    case 'equals':
      return normalizeValue(fieldValue) === normalizeValue(searchValue)
      
    case 'contains':
      return normalizeValue(fieldValue).includes(normalizeValue(searchValue))
      
    case 'gt':
      return parseNumericValue(fieldValue) > parseNumericValue(searchValue)
      
    case 'gte':
      return parseNumericValue(fieldValue) >= parseNumericValue(searchValue)
      
    case 'lt':
      return parseNumericValue(fieldValue) < parseNumericValue(searchValue)
      
    case 'lte':
      return parseNumericValue(fieldValue) <= parseNumericValue(searchValue)
      
    case 'in':
      if (Array.isArray(searchValue)) {
        return searchValue.some(val => 
          normalizeValue(fieldValue).includes(normalizeValue(val))
        )
      }
      return normalizeValue(fieldValue).includes(normalizeValue(searchValue))
      
    default:
      return false
  }
}

/**
 * Normalize values for comparison (case-insensitive, trimmed)
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value).toLowerCase().trim()
}

/**
 * Parse numeric values for comparison
 */
function parseNumericValue(value: any): number {
  if (typeof value === 'number') return value
  
  // Handle dates
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).getTime()
  }
  
  // Handle numbers
  const num = parseFloat(String(value))
  return isNaN(num) ? 0 : num
}

/**
 * Get available fields for each data type
 */
export function getAvailableFields(sessionData: {
  clients?: ParsedData
  workers?: ParsedData
  tasks?: ParsedData
}): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  
  if (sessionData.clients?.headers) {
    fields.clients = sessionData.clients.headers
  }
  
  if (sessionData.workers?.headers) {
    fields.workers = sessionData.workers.headers
  }
  
  if (sessionData.tasks?.headers) {
    fields.tasks = sessionData.tasks.headers
  }
  
  return fields
}

/**
 * Get sample data for AI context
 */
export function getSampleData(sessionData: {
  clients?: ParsedData
  workers?: ParsedData
  tasks?: ParsedData
}): Record<string, any[]> {
  const samples: Record<string, any[]> = {}
  
  if (sessionData.clients?.rows) {
    samples.clients = sessionData.clients.rows.slice(0, 3)
  }
  
  if (sessionData.workers?.rows) {
    samples.workers = sessionData.workers.rows.slice(0, 3)
  }
  
  if (sessionData.tasks?.rows) {
    samples.tasks = sessionData.tasks.rows.slice(0, 3)
  }
  
  return samples
}

/**
 * Build search suggestions based on data content
 */
export function buildContextualSuggestions(
  availableFields: Record<string, string[]>,
): string[] {
  const suggestions: string[] = []
  
  // Client-based suggestions
  if (availableFields.clients?.includes('priority')) {
    suggestions.push('Show high priority clients', 'Find critical priority clients')
  }
  
  if (availableFields.clients?.includes('clientname')) {
    suggestions.push('Search clients by name')
  }
  
  // Worker-based suggestions
  if (availableFields.workers?.includes('skills')) {
    suggestions.push('Find workers with specific skills', 'Workers with JavaScript experience')
  }
  
  if (availableFields.workers?.includes('availability')) {
    suggestions.push('Show available workers', 'Workers with high availability')
  }
  
  // Task-based suggestions
  if (availableFields.tasks?.includes('deadline')) {
    suggestions.push('Tasks due this week', 'Overdue tasks', 'Tasks due soon')
  }
  
  if (availableFields.tasks?.includes('duration')) {
    suggestions.push('Long duration tasks', 'Quick tasks under 2 hours')
  }
  
  // Skills matching suggestions
  if (availableFields.workers?.includes('skills') && availableFields.tasks?.includes('skills')) {
    suggestions.push('Tasks with skill gaps', 'Match workers to task requirements')
  }
  
  return suggestions.slice(0, 8) // Limit to 8 suggestions
}

/**
 * Demonstrate intelligent column name handling examples
 */
export function getIntelligentFilteringExamples(): Array<{
  query: string
  description: string
  csvVariations: string[]
  mappedField: string
}> {
  return [
    {
      query: "Show me expensive developers",
      description: "Maps 'developers' to workers and 'expensive' to high rate values",
      csvVariations: ["hourly_rate", "salary", "cost", "wage", "pay"],
      mappedField: "rate"
    },
    {
      query: "Find high priority companies",
      description: "Maps 'companies' to clients and understands priority levels",
      csvVariations: ["company_name", "client_name", "customer_name"],
      mappedField: "clientName"
    },
    {
      query: "React specialists with availability",
      description: "Handles technology skills and worker availability",
      csvVariations: ["technologies", "expertise", "competencies", "working_hours"],
      mappedField: "skills, availability"
    },
    {
      query: "Urgent tasks due soon",
      description: "Maps time-based queries to deadline fields",
      csvVariations: ["due_date", "completion_date", "target_date"],
      mappedField: "deadline"
    },
    {
      query: "Long duration projects",
      description: "Understands duration and time estimation fields",
      csvVariations: ["estimated_hours", "time_required", "effort"],
      mappedField: "duration"
    }
  ]
}
