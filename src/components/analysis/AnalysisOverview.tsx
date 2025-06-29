import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  Users, 
  Briefcase, 
  CheckSquare 
} from "lucide-react"

interface ValidationData {
  totalErrors: number
  criticalErrors: number
  criticalIssues: number
  warnings: number
  errors: Record<string, unknown[]>
}

interface SessionData {
  clients?: { rows: Record<string, unknown>[] }
  workers?: { rows: Record<string, unknown>[] }
  tasks?: { rows: Record<string, unknown>[] }
  [key: string]: { rows: Record<string, unknown>[] } | undefined
}

interface AnalysisOverviewProps {
  healthScore: number
  validation: ValidationData
  sessionData: SessionData
  validating: boolean
}

export function AnalysisOverview({ 
  healthScore, 
  validation, 
  sessionData, 
  validating 
}: AnalysisOverviewProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />
    if (score >= 60) return <Activity className="w-5 h-5 text-yellow-400" />
    return <AlertTriangle className="w-5 h-5 text-red-400" />
  }

  const dataTypes = [
    { key: 'clients', label: 'Clients', icon: Users, color: 'blue' },
    { key: 'workers', label: 'Workers', icon: Briefcase, color: 'green' },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'purple' }
  ]

  const availableDataTypes = dataTypes.filter(type => {
    const data = sessionData?.[type.key]
    const dataArray = data?.rows || []
    return Array.isArray(dataArray) && dataArray.length > 0
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getHealthScoreIcon(healthScore)}
            <div>
              <div className={`text-2xl font-bold ${getHealthScoreColor(healthScore)}`}>
                {validating ? '...' : `${healthScore}%`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {validating ? 'Calculating...' : 'Data quality'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">Total Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {validating ? '...' : (validation?.totalErrors || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Issues found</div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">Critical Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {validating ? '...' : (validation?.criticalIssues || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">High priority</div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">Data Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {availableDataTypes.map(type => (
              <Badge 
                key={type.key}
                variant="outline" 
                className="text-xs bg-white/5 border-white/20 text-white"
              >
                <type.icon className="w-3 h-3 mr-1" />
                {type.label}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {availableDataTypes.length} type{availableDataTypes.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
