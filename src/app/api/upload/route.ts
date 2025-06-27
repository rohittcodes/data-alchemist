import { NextRequest, NextResponse } from 'next/server'
import { parseFile, validateDataStructure } from '@/lib/parsers'
import { SessionManager } from '@/lib/kv-store'

// Simple UUID generation function
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Expected fields for validation (case insensitive)
const EXPECTED_FIELDS = {
  clients: ['clientid', 'clientname', 'requirements', 'priority'],
  workers: ['workerid', 'name', 'skills', 'availability', 'rate'],
  tasks: ['taskid', 'clientid', 'duration', 'skills', 'deadline']
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    const formData = await request.formData()
    
    // Log all form data entries
    console.log('FormData entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }
    
    // Get uploaded files
    const clientsFile = formData.get('clients') as File | null
    const workersFile = formData.get('workers') as File | null
    const tasksFile = formData.get('tasks') as File | null

    console.log('Received files:', {
      clients: clientsFile?.name,
      workers: workersFile?.name,
      tasks: tasksFile?.name
    })

    // Validate at least one file is provided
    if (!clientsFile && !workersFile && !tasksFile) {
      console.log('No files provided')
      return NextResponse.json(
        { error: 'At least one file must be provided' },
        { status: 400 }
      )
    }

    // Generate session ID
    const sessionId = generateSessionId()
    console.log('Generated session ID:', sessionId)
    
    // Create session
    const session = await SessionManager.createSession(sessionId)
    console.log('Session created:', session)

    const results: any = {
      sessionId,
      parsed: {},
      errors: [],
      warnings: []
    }

    // Parse and store each file
    if (clientsFile) {
      try {
        console.log('Parsing clients file:', clientsFile.name, 'size:', clientsFile.size, 'type:', clientsFile.type)
        const clientsData = await parseFile(clientsFile)
        console.log('Clients data parsed:', {
          rows: clientsData.rowCount,
          headers: clientsData.headers,
          firstRow: clientsData.rows[0]
        })
        
        const validationErrors = validateDataStructure(clientsData, EXPECTED_FIELDS.clients)
        
        if (validationErrors.length > 0) {
          console.log('Clients validation warnings:', validationErrors)
          results.warnings.push({
            file: 'clients',
            issues: validationErrors
          })
        }
        
        await SessionManager.addParsedData(sessionId, 'clients', clientsData)
        console.log('Clients data stored in session successfully')
        results.parsed.clients = {
          fileName: clientsData.fileName,
          rowCount: clientsData.rowCount,
          headers: clientsData.headers
        }
      } catch (error) {
        console.error('Clients parsing error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Clients error stack:', error instanceof Error ? error.stack : 'No stack')
        results.errors.push({
          file: 'clients',
          error: errorMessage
        })
      }
    }

    if (workersFile) {
      try {
        console.log('Parsing workers file:', workersFile.name, 'size:', workersFile.size, 'type:', workersFile.type)
        const workersData = await parseFile(workersFile)
        console.log('Workers data parsed:', {
          rows: workersData.rowCount,
          headers: workersData.headers,
          firstRow: workersData.rows[0]
        })
        const validationErrors = validateDataStructure(workersData, EXPECTED_FIELDS.workers)
        
        if (validationErrors.length > 0) {
          results.warnings.push({
            file: 'workers',
            issues: validationErrors
          })
        }
        
        await SessionManager.addParsedData(sessionId, 'workers', workersData)
        results.parsed.workers = {
          fileName: workersData.fileName,
          rowCount: workersData.rowCount,
          headers: workersData.headers
        }
      } catch (error) {
        console.error('Workers parsing error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Workers error stack:', error instanceof Error ? error.stack : 'No stack')
        results.errors.push({
          file: 'workers',
          error: errorMessage
        })
      }
    }

    if (tasksFile) {
      try {
        console.log('Parsing tasks file:', tasksFile.name, 'size:', tasksFile.size, 'type:', tasksFile.type)
        const tasksData = await parseFile(tasksFile)
        console.log('Tasks data parsed:', {
          rows: tasksData.rowCount,
          headers: tasksData.headers,
          firstRow: tasksData.rows[0]
        })
        const validationErrors = validateDataStructure(tasksData, EXPECTED_FIELDS.tasks)
        
        if (validationErrors.length > 0) {
          results.warnings.push({
            file: 'tasks',
            issues: validationErrors
          })
        }
        
        await SessionManager.addParsedData(sessionId, 'tasks', tasksData)
        results.parsed.tasks = {
          fileName: tasksData.fileName,
          rowCount: tasksData.rowCount,
          headers: tasksData.headers
        }
      } catch (error) {
        console.error('Tasks parsing error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Tasks error stack:', error instanceof Error ? error.stack : 'No stack')
        results.errors.push({
          file: 'tasks',
          error: errorMessage
        })
      }
    }

    // If all files failed to parse, return error
    if (Object.keys(results.parsed).length === 0) {
      await SessionManager.deleteSession(sessionId)
      return NextResponse.json(
        { 
          error: 'All files failed to parse',
          details: results.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Upload error:', error)
    console.error('Upload error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}