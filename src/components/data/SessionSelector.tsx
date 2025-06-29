"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, FileText } from 'lucide-react'

interface SessionSelectorProps {
  sessions: any[]
  loading: boolean
  onSessionSelect: (sessionId: string) => void
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actionLabel: string
  emptyTitle?: string
  emptyDescription?: string
}

export function SessionSelector({
  sessions,
  loading,
  onSessionSelect,
  title,
  description,
  icon: Icon,
  actionLabel,
  emptyTitle = "No Data Sessions Found",
  emptyDescription = "Upload your first dataset to get started"
}: SessionSelectorProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardContent className="p-8 text-center">
          <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{description}</p>
          <Button 
            onClick={() => router.push('/data')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="w-4 h-4 mr-2" />
            Upload New Data
          </Button>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Available Sessions</CardTitle>
            <CardDescription className="text-gray-400">
              Select a session to {actionLabel.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                  onClick={() => onSessionSelect(session.sessionId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        Session {session.sessionId.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(session.created).toLocaleDateString()} • 
                        {Object.keys(session.files).filter(key => session.files[key]).length} files
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        session.status === 'completed' 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : session.status === 'processing'
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {session.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{emptyTitle}</h3>
            <p className="text-gray-400 mb-4">{emptyDescription}</p>
            <Button 
              onClick={() => router.push('/data')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Upload Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
