import React from 'react'
import { CardSpotlight } from "@/components/ui/animated/spotlight-card"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { 
  TrendingUp, 
  CheckCircle, 
  Activity, 
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

interface QuickStatsProps {
  sessions: SessionInfo[]
  searchQuery: string
}

export function QuickStats({ sessions, searchQuery }: QuickStatsProps) {
  const totalDataPoints = sessions.reduce((total, session) => {
    return total + 
      (session.files.clients?.rowCount || 0) +
      (session.files.workers?.rowCount || 0) +
      (session.files.tasks?.rowCount || 0)
  }, 0)

  const completedCount = sessions.filter(s => s.status === 'completed').length
  const processingCount = sessions.filter(s => s.status === 'processing').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div>
        <CardSpotlight className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{searchQuery ? 'Filtered' : 'All time'}</span>
            </div>
          </CardContent>
        </CardSpotlight>
      </div>

      <div>
        <CardSpotlight className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedCount}</div>
            <div className="flex items-center gap-1 text-sm text-green-400 mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>Success rate</span>
            </div>
          </CardContent>
        </CardSpotlight>
      </div>

      <div>
        <CardSpotlight className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{processingCount}</div>
            <div className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
              <Activity className="w-3 h-3" />
              <span>In progress</span>
            </div>
          </CardContent>
        </CardSpotlight>
      </div>

      <div>
        <CardSpotlight className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalDataPoints.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-400 mt-1">
              <Database className="w-3 h-3" />
              <span>Total rows</span>
            </div>
          </CardContent>
        </CardSpotlight>
      </div>
    </div>
  )
}
