"use client"

import { useState, useEffect } from 'react'

interface SessionData {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

export function useSessionProcessing(sessionId: string) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`)
        
        if (!response.ok) {
          setLoading(false)
          return
        }
        
        const data = await response.json()
        setSessionData(data)
      } catch (error) {
        console.error('Failed to fetch session data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const startProcessing = () => {
    setProcessing(true)
    setProgress(0)

    // Simulate processing progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setProcessing(false)
          setSessionData(current => current ? { ...current, status: 'completed' } : null)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  return {
    sessionData,
    loading,
    processing,
    progress,
    startProcessing
  }
}
