"use client"

import { useState, useEffect } from 'react'

export function useDataSession(sessionId: string | null) {
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/session/${sessionId}?includeData=true`)
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }

        const session = await response.json()
        setSessionData(session)
      } catch (err) {
        console.error('Failed to load session data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId])

  const handleCellEdit = async (type: string, rowIndex: number, columnId: string, value: string) => {
    // Update local data
    if (sessionData && sessionData[type]) {
      const currentData = sessionData[type]
      // Handle both ParsedData format (with .rows) and direct array format
      const dataArray = currentData.rows || currentData.data || currentData
      
      if (Array.isArray(dataArray)) {
        const newData = [...dataArray]
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value }
        
        setSessionData((prev: any) => ({
          ...prev,
          [type]: currentData.rows ? { ...currentData, rows: newData } : newData
        }))
      }
    }
    
    // TODO: Save changes to session via API
    console.log('Cell edited:', { type, rowIndex, columnId, value })
  }

  const handleDownload = (type: string) => {
    if (!sessionData || !sessionData[type]) return

    const currentData = sessionData[type]
    // Handle both ParsedData format (with .rows) and direct array format
    const dataArray = currentData.rows || currentData.data || currentData
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) return

    // Convert data to CSV
    const headers = Object.keys(dataArray[0])
    const csvContent = [
      headers.join(','),
      ...dataArray.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-data.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    sessionData,
    loading,
    error,
    handleCellEdit,
    handleDownload,
    setSessionData
  }
}
