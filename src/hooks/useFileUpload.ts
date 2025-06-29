import { useState } from 'react'

export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({
    clients: null,
    workers: null,
    tasks: null
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isCreatingPreview, setIsCreatingPreview] = useState(false)

  const handleFileSelect = (type: 'clients' | 'workers' | 'tasks') => (file: File | null) => {
    console.log(`File selected for ${type}:`, file)
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const parseCSVFile = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      throw new Error('File is empty')
    }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    })

    return { headers, data }
  }

  const handleViewFile = async (file: File, type: string, router: any) => {
    setIsCreatingPreview(true)
    setUploadError(null)
    try {
      const { headers, data } = await parseCSVFile(file)
      
      const previewData = {
        fileName: file.name,
        headers,
        data: data.slice(0, 100),
        totalRows: data.length,
        fileSize: file.size
      }
      
      sessionStorage.setItem(`preview_${type}`, JSON.stringify(previewData))
      router.push(`/data/view/${type}`)
    } catch (error) {
      console.error('Error parsing file:', error)
      setUploadError(`Failed to parse ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreatingPreview(false)
    }
  }

  const proceedToAnalysis = async (router: any) => {
    if (!uploadedFiles.clients && !uploadedFiles.workers && !uploadedFiles.tasks) {
      setUploadError('Please upload at least one file to proceed')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      
      Object.entries(uploadedFiles).forEach(([type, file]) => {
        if (file) {
          formData.append(type, file)
        }
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      if (data.sessionId) {
        setUploadedFiles({ clients: null, workers: null, tasks: null })
        router.push(`/analysis/${data.sessionId}`)
      } else {
        throw new Error('No session ID received')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setUploadedFiles({ clients: null, workers: null, tasks: null })
    setUploadError(null)
    setIsUploading(false)
    setIsCreatingPreview(false)
  }

  return {
    uploadedFiles,
    isUploading,
    uploadError,
    isCreatingPreview,
    handleFileSelect,
    handleViewFile,
    proceedToAnalysis,
    reset
  }
}
