import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  Activity, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Calendar,
  Database
} from "lucide-react"

interface SessionInfo {
  sessionId: string
  status: string
  created: number
  lastModified: number
  files: {
    clients?: { rowCount: number } | null
    workers?: { rowCount: number } | null
    tasks?: { rowCount: number } | null
  }
}

interface RecentSessionsProps {
  sessions: SessionInfo[]
  loading: boolean
  onAnalyze: (sessionId: string) => void
  onView: (sessionId: string) => void
}

export function RecentSessions({ sessions, loading, onAnalyze, onView }: RecentSessionsProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Sessions</CardTitle>
          <CardDescription className="text-gray-400">
            Your recent data analysis sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Recent Sessions</CardTitle>
        <CardDescription className="text-gray-400">
          Your recent data analysis sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No recent sessions found</p>
            <p className="text-sm text-gray-500 mt-1">Upload your first dataset to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.sessionId}
                className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(session.status)} text-xs`}
                    >
                      {session.status}
                    </Badge>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(session.created)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAnalyze(session.sessionId)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      Analyze
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(session.sessionId)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {session.files.clients && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        {session.files.clients.rowCount} clients
                      </span>
                    </div>
                  )}
                  {session.files.workers && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        {session.files.workers.rowCount} workers
                      </span>
                    </div>
                  )}
                  {session.files.tasks && (
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">
                        {session.files.tasks.rowCount} tasks
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
