import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  rowCount: number
  fileName: string
  fileSize: number
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

          const headers = results.meta.fields || []
          const rows = results.data as Record<string, any>[]

          console.log('CSV parsed successfully:', {
            headers,
            rowCount: rows.length,
            firstRow: rows[0]
          })

          resolve({
            headers,
            rows,
            rowCount: rows.length,
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
      
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)
      
      // Convert rows to objects
      const rows = dataRows.map(row => {
        const rowObj: Record<string, any> = {}
        headers.forEach((header, index) => {
          rowObj[header] = (row as any[])[index] || ''
        })
        return rowObj
      })

      console.log('Excel parsed successfully:', {
        headers,
        rowCount: rows.length,
        firstRow: rows[0]
      })

      resolve({
        headers,
        rows,
        rowCount: rows.length,
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
  const headers = data.headers.map(h => h.toLowerCase().trim())
  
  for (const field of expectedFields) {
    if (!headers.includes(field.toLowerCase())) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  return errors
}
