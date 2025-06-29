import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  Activity,
  Eye,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
  Database
} from "lucide-react"

interface FileInfo {
  fileName: string
  rowCount: number
  headers: string[]
  fileSize: number
}

interface SearchMatch {
  field: string
  value: string
  matchType: string
}

interface RowMatch {
  rowIndex: number
  row: Record<string, unknown>
  matches: SearchMatch[]
}

interface SessionInfo {
  sessionId: string
  status: string
  created: number
  lastModified: number
  files: {
    clients?: FileInfo | null
    workers?: FileInfo | null
    tasks?: FileInfo | null
  }
  searchMatches?: Record<string, RowMatch[]>
  totalMatches?: number
}

interface SessionsListProps {
  sessions: SessionInfo[]
  onSessionClick: (sessionId: string) => void
  onAnalyzeClick: (sessionId: string) => void
  onViewClick: (sessionId: string) => void
  onExportClick: (sessionId: string) => void
}

export function SessionsList({ 
  sessions, 
  onSessionClick, 
  onAnalyzeClick, 
  onViewClick, 
  onExportClick 
}: SessionsListProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Activity className="w-4 h-4 animate-spin" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors cursor-pointer"
          onClick={() => onSessionClick(session.sessionId)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(session.status)} flex items-center gap-1`}
              >
                {getStatusIcon(session.status)}
                {session.status}
              </Badge>
              {session.totalMatches && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  {session.totalMatches} matches
                </Badge>
              )}
              <span className="text-sm text-gray-400">
                {formatDate(session.created)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAnalyzeClick(session.sessionId)
                }}
                className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
              >
                <Activity className="w-3 h-3 mr-1" />
                Analyze
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewClick(session.sessionId)
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onExportClick(session.sessionId)
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
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
          
          {/* Search Match Details */}
          {session.searchMatches && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                <Search className="w-3 h-3" />
                Content matches found:
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(session.searchMatches).map(([dataType, matches]: [string, RowMatch[]]) => {
                  if (!matches || !Array.isArray(matches) || matches.length === 0) return null;
                  return (
                    <div key={dataType} className="text-gray-400">
                      <span className="capitalize text-white">{dataType}:</span> {matches.length} match(es)
                      {matches.slice(0, 2).map((match: RowMatch, idx: number) => (
                        <div key={idx} className="ml-2 text-gray-500">
                          • Row {match.rowIndex + 1}: {match.matches?.[0]?.field} = &quot;{match.matches?.[0]?.value?.slice(0, 30)}...&quot;
                        </div>
                      ))}
                      {matches.length > 2 && (
                        <div className="ml-2 text-gray-500">• ...and {matches.length - 2} more</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
