"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

interface UseSessionsOptions {
  sessionId?: string | null
  redirectOnNoAuth?: boolean
}

export function useSessions({ sessionId, redirectOnNoAuth = true }: UseSessionsOptions = {}) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !user && redirectOnNoAuth) {
      router.push('/sign-in')
      return
    }

    if (sessionId) {
      fetchSessionData(sessionId)
    } else {
      fetchSessions()
    }
  }, [sessionId, isLoaded, user, router, redirectOnNoAuth])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data.sessions || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionData = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/session/${id}?includeData=true`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Session ${id} not found. Please upload files again.`)
        }
        throw new Error('Failed to fetch session data')
      }
      
      const data = await response.json()
      setSessionData(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching session data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session data')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    if (sessionId) {
      fetchSessionData(sessionId)
    } else {
      fetchSessions()
    }
  }

  return {
    sessionData,
    sessions,
    loading,
    error,
    isLoaded,
    user,
    refetch
  }
}
