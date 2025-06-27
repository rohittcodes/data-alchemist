import { NextRequest, NextResponse } from 'next/server'
import { GoogleAIService } from '@/lib/ai/google-ai-service'

interface CreateRuleRequest {
  text: string
  sessionId: string
  availableTasks?: { id: string; title: string }[]
  availableWorkers?: { id: string; name: string }[]
}

interface RuleOutput {
  type: 'coRun' | 'loadLimit' | 'phaseWindow'
  description: string
  tasks?: string[]
  workers?: string[]
  maxLoad?: number
  startDate?: string
  endDate?: string
  phase?: string
}

export async function POST(req: NextRequest) {
  try {
    const { text, sessionId, availableTasks = [], availableWorkers = [] }: CreateRuleRequest = await req.json()

    if (!text || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: text and sessionId' },
        { status: 400 }
      )
    }

    const aiService = new GoogleAIService()
    
    // Generate rule using AI
    const rule = await generateRuleFromText(aiService, text, availableTasks, availableWorkers)
    
    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error creating rule from natural language:', error)
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    )
  }
}

async function generateRuleFromText(
  aiService: GoogleAIService,
  text: string,
  availableTasks: { id: string; title: string }[],
  availableWorkers: { id: string; name: string }[]
): Promise<RuleOutput> {
  const prompt = buildRuleCreationPrompt(text, availableTasks, availableWorkers)
  
  try {
    const response = await aiService.generateContent(prompt)
    return parseRuleResponse(response, availableTasks, availableWorkers)
  } catch (aiError) {
    console.error('AI service error:', aiError)
    
    // Fallback to rule-based parsing
    return generateRuleBasedOnKeywords(text, availableTasks, availableWorkers)
  }
}

function buildRuleCreationPrompt(
  text: string,
  availableTasks: { id: string; title: string }[],
  availableWorkers: { id: string; name: string }[]
): string {
  return `You are a project management rule expert. Convert this natural language description into a structured rule.

USER REQUEST: "${text}"

AVAILABLE TASKS:
${availableTasks.map(t => `- ID: ${t.id}, Title: "${t.title}"`).join('\n')}

AVAILABLE WORKERS:
${availableWorkers.map(w => `- ID: ${w.id}, Name: "${w.name}"`).join('\n')}

SUPPORTED RULE TYPES:

1. CO-RUN RULES: Tasks that must execute together
   - Keywords: "together", "same time", "co-run", "paired", "linked"
   - Output: {"type": "coRun", "tasks": ["task1", "task2"], "description": "..."}

2. LOAD LIMIT RULES: Maximum task capacity for workers
   - Keywords: "maximum", "limit", "capacity", "can only", "at most"
   - Output: {"type": "loadLimit", "workers": ["worker1"], "maxLoad": 3, "description": "..."}

3. PHASE WINDOW RULES: Time constraints for project phases
   - Keywords: "phase", "period", "from...to", "between", "during"
   - Output: {"type": "phaseWindow", "phase": "Phase 1", "startDate": "2025-01-01", "endDate": "2025-03-31", "description": "..."}

INSTRUCTIONS:
1. Identify the rule type based on keywords and context
2. Extract relevant entity names and match them to available IDs
3. Generate a clear, descriptive rule description
4. Return valid JSON in the exact format shown above
5. If dates are mentioned, use YYYY-MM-DD format
6. If numbers are mentioned, extract them as integers

EXAMPLE CONVERSIONS:
- "Task A and Task B must run together" → {"type": "coRun", "tasks": ["taskA_id"], "description": "Task A and Task B must run together"}
- "John can work on maximum 5 tasks" → {"type": "loadLimit", "workers": ["john_id"], "maxLoad": 5, "description": "John can work on maximum 5 tasks"}
- "Phase 1 runs from January to March 2025" → {"type": "phaseWindow", "phase": "Phase 1", "startDate": "2025-01-01", "endDate": "2025-03-31", "description": "Phase 1 runs from January to March 2025"}

Respond with ONLY a valid JSON object that matches one of the supported rule types.`
}

function parseRuleResponse(
  aiResponse: string,
  availableTasks: { id: string; title: string }[],
  availableWorkers: { id: string; name: string }[]
): RuleOutput {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate and clean up the parsed rule
    if (!parsed.type || !['coRun', 'loadLimit', 'phaseWindow'].includes(parsed.type)) {
      throw new Error('Invalid rule type')
    }
    
    // Validate task/worker IDs exist
    if (parsed.tasks) {
      parsed.tasks = parsed.tasks.filter((taskId: string) => 
        availableTasks.some(t => t.id === taskId)
      )
    }
    
    if (parsed.workers) {
      parsed.workers = parsed.workers.filter((workerId: string) => 
        availableWorkers.some(w => w.id === workerId)
      )
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw new Error('Invalid AI response format')
  }
}

function generateRuleBasedOnKeywords(
  text: string,
  availableTasks: { id: string; title: string }[],
  availableWorkers: { id: string; name: string }[]
): RuleOutput {
  const lowerText = text.toLowerCase()
  
  // Check for co-run keywords
  if (lowerText.includes('together') || lowerText.includes('same time') || 
      lowerText.includes('co-run') || lowerText.includes('paired') ||
      lowerText.includes('linked')) {
    
    // Try to find task names mentioned in text
    const mentionedTasks = availableTasks.filter(task => 
      lowerText.includes(task.title.toLowerCase()) || lowerText.includes(task.id.toLowerCase())
    )
    
    return {
      type: 'coRun',
      tasks: mentionedTasks.slice(0, 2).map(t => t.id),
      description: `Tasks must run together: ${text}`
    }
  }
  
  // Check for load limit keywords
  if (lowerText.includes('maximum') || lowerText.includes('limit') || 
      lowerText.includes('capacity') || lowerText.includes('can only') ||
      lowerText.includes('at most')) {
    
    // Extract number
    const numberMatch = text.match(/\d+/)
    const maxLoad = numberMatch ? parseInt(numberMatch[0]) : 1
    
    // Try to find worker names
    const mentionedWorkers = availableWorkers.filter(worker => 
      lowerText.includes(worker.name.toLowerCase()) || lowerText.includes(worker.id.toLowerCase())
    )
    
    return {
      type: 'loadLimit',
      workers: mentionedWorkers.slice(0, 1).map(w => w.id),
      maxLoad,
      description: `Worker load limit: ${text}`
    }
  }
  
  // Check for phase window keywords
  if (lowerText.includes('phase') || lowerText.includes('period') || 
      lowerText.includes('from') || lowerText.includes('during')) {
    
    // Extract phase name
    const phaseMatch = text.match(/phase\s+(\w+|\d+)/i)
    const phaseName = phaseMatch ? phaseMatch[1] : 'Custom Phase'
    
    // Try to extract dates (basic patterns)
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return {
      type: 'phaseWindow',
      phase: phaseName,
      startDate,
      endDate,
      description: `Phase window rule: ${text}`
    }
  }
  
  // Default fallback
  return {
    type: 'coRun',
    tasks: [],
    description: `Custom rule: ${text}`
  }
}
