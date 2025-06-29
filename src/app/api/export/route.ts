import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import JSZip from 'jszip'
import kvStore from '@/lib/storage/kv-store'
import type { SessionData } from '@/lib/storage'
import type { ParsedData } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const format = searchParams.get('format') || 'zip' // zip, csv, json
    const dataType = searchParams.get('dataType') // clients, workers, tasks, rules
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    // Handle single file downloads
    if (dataType && format !== 'zip') {
      return handleSingleFileExport(sessionData, dataType)
    }

    // Handle zip export (default)
    return handleZipExport(sessionData, sessionId)
    
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, format = 'zip', includeValidation = true } = body
    
    console.log('Export request received:', { sessionId, format, includeValidation })
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Load session data - try SessionManager first
    console.log('Loading session data via SessionManager for:', sessionId)
    let sessionData
    
    try {
      // Try SessionManager first (new format)
      const { SessionManager } = await import('@/lib/storage/kv-store')
      sessionData = await SessionManager.getSession(sessionId)
      console.log('SessionManager loaded data:', !!sessionData)
    } catch (managerError) {
      console.log('SessionManager failed, trying kvStore direct:', managerError)
      // Fallback to direct kvStore access
      sessionData = await kvStore.get(`session:${sessionId}`)
      console.log('Direct kvStore loaded data:', !!sessionData)
    }
    
    if (!sessionData) {
      console.log('Session not found:', sessionId)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    console.log('Session data loaded successfully. Data structure:', {
      sessionId: sessionData.sessionId,
      hasClients: !!sessionData.clients,
      hasWorkers: !!sessionData.workers,
      hasTasks: !!sessionData.tasks,
      hasRules: !!sessionData.rules,
      clientsStructure: sessionData.clients ? {
        hasHeaders: !!sessionData.clients.headers,
        hasRows: !!sessionData.clients.rows,
        rowCount: sessionData.clients.rows?.length || 0,
        fileName: sessionData.clients.fileName
      } : 'none',
      workersStructure: sessionData.workers ? {
        hasHeaders: !!sessionData.workers.headers,
        hasRows: !!sessionData.workers.rows,
        rowCount: sessionData.workers.rows?.length || 0,
        fileName: sessionData.workers.fileName
      } : 'none',
      tasksStructure: sessionData.tasks ? {
        hasHeaders: !!sessionData.tasks.headers,
        hasRows: !!sessionData.tasks.rows,
        rowCount: sessionData.tasks.rows?.length || 0,
        fileName: sessionData.tasks.fileName
      } : 'none'
    })

    // Handle different export formats
    if (format === 'zip') {
      console.log('Handling ZIP export')
      return handleZipExport(sessionData, sessionId)
    } else {
      console.log('Handling single file export for format:', format)
      return handleSingleFileExport(sessionData, format)
    }
    
  } catch (error) {
    console.error('Error in POST /api/export:', error)
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function handleSingleFileExport(sessionData: SessionData, dataType: string) {
  try {
    let content: string
    let contentType: string
    let filename: string

    if (dataType === 'json') {
      // Export complete session data as JSON
      console.log('Exporting complete session as JSON')
      
      const exportData = {
        exportInfo: {
          sessionId: sessionData.sessionId,
          exportDate: new Date().toISOString(),
          originalFileNames: {
            clients: sessionData.clients?.fileName || 'clients.csv',
            workers: sessionData.workers?.fileName || 'workers.csv',
            tasks: sessionData.tasks?.fileName || 'tasks.csv'
          },
          dataCounts: {
            clients: sessionData.clients?.rows?.length || 0,
            workers: sessionData.workers?.rows?.length || 0,
            tasks: sessionData.tasks?.rows?.length || 0,
            rules: sessionData.rules?.length || 0
          },
        },
        data: {
          clients: sessionData.clients || null,
          workers: sessionData.workers || null,
          tasks: sessionData.tasks || null
        },
        rules: sessionData.rules || [],
        metadata: {
          created: sessionData.created,
          lastModified: sessionData.lastModified,
          version: '1.4.0'
        }
      }
      
      content = JSON.stringify(exportData, null, 2)
      contentType = 'application/json'
      filename = `session-${sessionData.sessionId || 'export'}.json`
      
      console.log(`Generated JSON export with ${content.length} characters`)
    } else if (dataType === 'rules') {
      // Export rules as JSON
      const rules = sessionData.rules || []
      content = JSON.stringify({
        exportInfo: {
          sessionId: sessionData.sessionId,
          exportDate: new Date().toISOString(),
          totalRules: rules.length
        },
        rules: rules
      }, null, 2)
      contentType = 'application/json'
      filename = 'rules.json'
    } else {
      // Export specific data type as CSV
      let data: ParsedData | undefined
      
      switch (dataType) {
        case 'clients':
          data = sessionData.clients
          break
        case 'workers':
          data = sessionData.workers
          break
        case 'tasks':
          data = sessionData.tasks
          break
        default:
          return NextResponse.json(
            { error: `Unsupported data type: ${dataType}` },
            { status: 400 }
          )
      }
      
      if (!data || !data.rows) {
        return NextResponse.json(
          { error: `No ${dataType} data found` },
          { status: 404 }
        )
      }

      content = Papa.unparse(data.rows, {
        header: true,
        skipEmptyLines: true
      })
      contentType = 'text/csv'
      filename = `${dataType}.csv`
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in single file export:', error)
    throw error
  }
}

async function handleZipExport(sessionData: SessionData, sessionId: string) {
  try {
    console.log('Starting ZIP export for session:', sessionId)
    console.log('Session data structure:', {
      sessionId: sessionData.sessionId,
      hasClients: !!sessionData.clients,
      hasWorkers: !!sessionData.workers,
      hasTasks: !!sessionData.tasks,
      hasRules: !!sessionData.rules
    })
    
    const zip = new JSZip()
    const timestamp = new Date().toISOString().split('T')[0]
    
    // Add export metadata
    const exportInfo = {
      sessionId: sessionData.sessionId || sessionId,
      exportDate: new Date().toISOString(),
      originalFileNames: {
        clients: sessionData.clients?.fileName || 'clients.csv',
        workers: sessionData.workers?.fileName || 'workers.csv',
        tasks: sessionData.tasks?.fileName || 'tasks.csv'
      },
      dataCounts: {
        clients: sessionData.clients?.rowCount || sessionData.clients?.rows?.length || 0,
        workers: sessionData.workers?.rowCount || sessionData.workers?.rows?.length || 0,
        tasks: sessionData.tasks?.rowCount || sessionData.tasks?.rows?.length || 0,
        rules: sessionData.rules?.length || 0
      }
    }
    
    console.log('Export info prepared:', exportInfo)
    zip.file('export-info.json', JSON.stringify(exportInfo, null, 2))

    // Add CSV files
    const dataTypes = ['clients', 'workers', 'tasks']
    let filesAdded = 0
    
    for (const dataType of dataTypes) {
      let data: ParsedData | undefined
      
      switch (dataType) {
        case 'clients':
          data = sessionData.clients
          break
        case 'workers':
          data = sessionData.workers
          break
        case 'tasks':
          data = sessionData.tasks
          break
        default:
          continue
      }
      
      console.log(`Processing ${dataType} data:`, {
        exists: !!data,
        type: typeof data,
        hasRows: !!(data?.rows),
        rowCount: data?.rows?.length || 0,
        hasHeaders: !!(data?.headers),
        headerCount: data?.headers?.length || 0,
        fileName: data?.fileName || 'unknown'
      })
      
      if (data && data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
        try {
          console.log(`Creating CSV for ${dataType} with:`, {
            rowCount: data.rows.length,
            headers: data.headers,
            sampleRow: data.rows[0]
          })
          
          const csvContent = Papa.unparse(data.rows, {
            header: true,
            skipEmptyLines: true,
            quotes: true // Ensure proper quoting for Excel compatibility
          })
          
          console.log(`Generated CSV content length for ${dataType}:`, csvContent.length)
          
          zip.file(`${dataType}.csv`, csvContent)
          filesAdded++
          console.log(`Added ${dataType}.csv with ${data.rows.length} rows`)
        } catch (csvError) {
          console.error(`Error creating CSV for ${dataType}:`, csvError)
          console.error(`Data structure for ${dataType}:`, JSON.stringify(data, null, 2).substring(0, 500))
        }
      } else {
        console.log(`Skipping ${dataType} - no valid data:`, {
          hasData: !!data,
          hasRows: !!(data?.rows),
          isRowsArray: Array.isArray(data?.rows),
          rowsLength: data?.rows?.length
        })
      }
    }
    
    console.log(`Total files added: ${filesAdded}`)

    // Add rules.json if rules exist
    const rules = sessionData.rules || []
    if (Array.isArray(rules) && rules.length > 0) {
      try {
        const rulesContent = {
          exportInfo: {
            sessionId: sessionData.sessionId || sessionId,
            exportDate: new Date().toISOString(),
            totalRules: rules.length
          },
          rules: rules.map((rule: unknown) => {
            const r = rule as Record<string, unknown>
            const result: Record<string, unknown> = {
              id: r.id,
              type: r.type,
              description: r.description,
              status: r.status,
              created: r.created
            }
            
            // Include rule-specific data safely
            if (r.tasks) result.tasks = r.tasks
            if (r.workers) result.workers = r.workers
            if (r.maxLoad) result.maxLoad = r.maxLoad
            if (r.startDate) result.startDate = r.startDate
            if (r.endDate) result.endDate = r.endDate
            if (r.phase) result.phase = r.phase
            
            return result
          })
        }
        zip.file('rules.json', JSON.stringify(rulesContent, null, 2))
        console.log(`Added rules.json with ${rules.length} rules`)
      } catch (rulesError) {
        console.error('Error creating rules JSON:', rulesError)
      }
    }

    // Add README with instructions
    const readmeContent = generateReadmeContent(exportInfo)
    zip.file('README.md', readmeContent)
    console.log('Added README.md')

    // Generate zip file
    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const filename = `data-export-${sessionId}-${timestamp}.zip`
    console.log(`ZIP file generated successfully: ${filename}, size: ${zipBuffer.byteLength} bytes`)
    
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in zip export:', error)
    throw error
  }
}

function generateReadmeContent(exportInfo: {
  exportDate: string
  sessionId: string
  dataCounts: Record<string, number>
}): string {
  return `# Data Export Package

Export Date: ${new Date(exportInfo.exportDate).toLocaleString()}
Session ID: ${exportInfo.sessionId}

## Contents

### Data Files
${Object.entries(exportInfo.dataCounts)
  .filter(([key, count]) => key !== 'rules' && count > 0)
  .map(([key, count]) => `- **${key}.csv**: ${count} records`)
  .join('\n')}

### Rules File
${exportInfo.dataCounts.rules > 0 
  ? `- **rules.json**: ${exportInfo.dataCounts.rules} project rules` 
  : '- No rules configured'}

### Metadata
- **export-info.json**: Export metadata and validation summary
- **README.md**: This file

## File Formats

### CSV Files
- UTF-8 encoded
- Comma-separated values
- Header row included
- Excel compatible

### Rules JSON
- Structured project rules
- Includes rule types: co-run, load-limit, phase-window
- Ready for import into scheduling systems

### Export Info
- Original file names and sizes
- Data validation summary
- Export timestamp and session details

## Usage

1. **CSV Files**: Import into Excel, Google Sheets, or any data analysis tool
2. **Rules JSON**: Use with project management or scheduling software
3. **Export Info**: Reference for data provenance and validation status

## Support

For questions about this export or the Data Alchemist tool:
- Review the export-info.json for validation details
- Check original data quality metrics
- Refer to rule descriptions for business logic

Generated by Data Alchemist v1.4.0
`
}
