import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import JSZip from 'jszip'
import kvStore from '@/lib/storage/kv-store'

// Rule type definition
interface Rule {
  id: string
  type: 'coRun' | 'loadLimit' | 'phaseWindow'
  description: string
  status: 'active' | 'inactive' | 'error'
  created: number
  // Rule-specific data
  tasks?: string[]
  workers?: string[]
  maxLoad?: number
  startDate?: string
  endDate?: string
  phase?: string
}

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

async function handleSingleFileExport(sessionData: any, dataType: string) {
  try {
    let content: string
    let contentType: string
    let filename: string

    if (dataType === 'rules') {
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
      // Export data as CSV
      const data = sessionData[dataType]
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

async function handleZipExport(sessionData: any, sessionId: string) {
  try {
    const zip = new JSZip()
    const timestamp = new Date().toISOString().split('T')[0]
    
    // Add export metadata
    const exportInfo = {
      sessionId: sessionData.sessionId,
      exportDate: new Date().toISOString(),
      originalFileNames: {
        clients: sessionData.clients?.fileName || 'clients.csv',
        workers: sessionData.workers?.fileName || 'workers.csv',
        tasks: sessionData.tasks?.fileName || 'tasks.csv'
      },
      dataCounts: {
        clients: sessionData.clients?.rowCount || 0,
        workers: sessionData.workers?.rowCount || 0,
        tasks: sessionData.tasks?.rowCount || 0,
        rules: sessionData.rules?.length || 0
      },
      validationSummary: sessionData.validationSummary || null
    }
    
    zip.file('export-info.json', JSON.stringify(exportInfo, null, 2))

    // Add CSV files
    const dataTypes = ['clients', 'workers', 'tasks']
    for (const dataType of dataTypes) {
      const data = sessionData[dataType]
      if (data && data.rows && data.rows.length > 0) {
        const csvContent = Papa.unparse(data.rows, {
          header: true,
          skipEmptyLines: true,
          quotes: true // Ensure proper quoting for Excel compatibility
        })
        zip.file(`${dataType}.csv`, csvContent)
      }
    }

    // Add rules.json if rules exist
    const rules = sessionData.rules || []
    if (rules.length > 0) {
      const rulesContent = {
        exportInfo: {
          sessionId: sessionData.sessionId,
          exportDate: new Date().toISOString(),
          totalRules: rules.length
        },
        rules: rules.map((rule: Rule) => ({
          id: rule.id,
          type: rule.type,
          description: rule.description,
          status: rule.status,
          created: rule.created,
          // Include rule-specific data
          ...(rule.tasks && { tasks: rule.tasks }),
          ...(rule.workers && { workers: rule.workers }),
          ...(rule.maxLoad && { maxLoad: rule.maxLoad }),
          ...(rule.startDate && { startDate: rule.startDate }),
          ...(rule.endDate && { endDate: rule.endDate }),
          ...(rule.phase && { phase: rule.phase })
        }))
      }
      zip.file('rules.json', JSON.stringify(rulesContent, null, 2))
    }

    // Add README with instructions
    const readmeContent = generateReadmeContent(exportInfo)
    zip.file('README.md', readmeContent)

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const filename = `data-export-${sessionId}-${timestamp}.zip`
    
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
