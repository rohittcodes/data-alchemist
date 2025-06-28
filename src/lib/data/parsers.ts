import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ParsedData } from '../types'

// Re-export types for convenience
export type { ParsedData, DataRow } from '../types'

// Field mapping for consistent data structure
const FIELD_MAPPINGS: Record<string, string> = {
  // Client fields
  'clientid': 'clientId',
  'client_id': 'clientId',
  'ClientID': 'clientId',
  'Client ID': 'clientId',
  'clientname': 'clientName',
  'client_name': 'clientName',
  'ClientName': 'clientName',
  'Client Name': 'clientName',
  
  // Worker fields
  'workerid': 'workerId',
  'worker_id': 'workerId',
  'WorkerID': 'workerId',
  'Worker ID': 'workerId',
  
  // Task fields
  'taskid': 'taskId',
  'task_id': 'taskId',
  'TaskID': 'taskId',
  'Task ID': 'taskId',
}

/**
 * Normalize field names to match our expected interface structure
 */
function normalizeFieldName(header: string): string {
  const trimmed = header.trim()
  // Check direct mapping first
  if (FIELD_MAPPINGS[trimmed]) {
    return FIELD_MAPPINGS[trimmed]
  }
  
  // Check case-insensitive mapping
  const lowerHeader = trimmed.toLowerCase()
  if (FIELD_MAPPINGS[lowerHeader]) {
    return FIELD_MAPPINGS[lowerHeader]
  }
  
  // Convert to camelCase for consistency
  return trimmed.replace(/[\s_-]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase())
}

/**
 * Normalize row data to use consistent field names
 */
function normalizeRowData(row: Record<string, any>): Record<string, any> {
  const normalizedRow: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeFieldName(key)
    normalizedRow[normalizedKey] = value
  }
  
  return normalizedRow
}

export async function parseCSV(file: File): Promise<ParsedData> {
  console.log('parseCSV: Starting to parse', file.name)
  
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to text content first (this works in Node.js)
      const text = await file.text()
      console.log('File content read, length:', text.length)
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('Papa.parse complete:', {
            errors: results.errors,
            meta: results.meta,
            dataLength: results.data?.length
          })
          
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors)
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
            return
          }

          const originalHeaders = results.meta.fields || []
          const originalRows = results.data as Record<string, any>[]

          // Normalize headers and data
          const normalizedHeaders = originalHeaders.map(normalizeFieldName)
          const normalizedRows = originalRows.map(normalizeRowData)

          console.log('CSV parsed and normalized successfully:', {
            originalHeaders,
            normalizedHeaders,
            rowCount: normalizedRows.length,
            firstRow: normalizedRows[0]
          })

          resolve({
            headers: normalizedHeaders,
            rows: normalizedRows,
            rowCount: normalizedRows.length,
            fileName: file.name,
            fileSize: file.size
          })
        },
        error: (error: any) => {
          console.error('Papa.parse error:', error)
          reject(new Error(`CSV parsing failed: ${error.message}`))
        }
      })
    } catch (error) {
      console.error('parseCSV exception:', error)
      reject(new Error(`CSV parsing exception: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}

export async function parseXLSX(file: File): Promise<ParsedData> {
  console.log('parseXLSX: Starting to parse', file.name)
  
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to ArrayBuffer (this works in Node.js)
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      console.log('Excel file read, size:', data.length)
      
      const workbook = XLSX.read(data, { type: 'array' })
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length === 0) {
        reject(new Error('Excel file is empty'))
        return
      }
      
      const originalHeaders = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)
      
      // Convert rows to objects with original headers
      const originalRows = dataRows.map(row => {
        const rowObj: Record<string, any> = {}
        originalHeaders.forEach((header, index) => {
          rowObj[header] = (row as any[])[index] || ''
        })
        return rowObj
      })

      // Normalize headers and data
      const normalizedHeaders = originalHeaders.map(normalizeFieldName)
      const normalizedRows = originalRows.map(normalizeRowData)

      console.log('Excel parsed and normalized successfully:', {
        originalHeaders,
        normalizedHeaders,
        rowCount: normalizedRows.length,
        firstRow: normalizedRows[0]
      })

      resolve({
        headers: normalizedHeaders,
        rows: normalizedRows,
        rowCount: normalizedRows.length,
        fileName: file.name,
        fileSize: file.size
      })
    } catch (error) {
      console.error('parseXLSX exception:', error)
      reject(new Error(`Excel parsing failed: ${error}`))
    }
  })
}

export async function parseFile(file: File): Promise<ParsedData> {
  console.log('parseFile called with:', file.name, 'type:', file.type, 'size:', file.size)
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  console.log('Detected file extension:', fileExtension)
  
  switch (fileExtension) {
    case 'csv':
      console.log('Calling parseCSV')
      return parseCSV(file)
    case 'xlsx':
    case 'xls':
      console.log('Calling parseXLSX')
      return parseXLSX(file)
    default:
      console.error('Unsupported file type:', fileExtension)
      throw new Error(`Unsupported file type: ${fileExtension}`)
  }
}

export function validateDataStructure(data: ParsedData, expectedFields: string[]): string[] {
  const errors: string[] = []
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  
  for (const field of expectedFields) {
    if (!headers.includes(field.toLowerCase())) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  return errors
}
