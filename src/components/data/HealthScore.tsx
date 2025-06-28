'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HealthScoreProps {
  healthScore: number
  totalErrors: number
  totalWarnings: number
}

export const HealthScore: React.FC<HealthScoreProps> = ({ 
  healthScore, 
  totalErrors, 
  totalWarnings 
}) => {
  return (
    <>
      {/* Health Score Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Data Quality Score</span>
          <span className="font-medium">{healthScore}%</span>
        </div>
        <Progress 
          value={healthScore} 
          className={cn(
            "h-2",
            healthScore >= 80 && "[&>div]:bg-green-500",
            healthScore >= 60 && healthScore < 80 && "[&>div]:bg-orange-500",
            healthScore < 60 && "[&>div]:bg-red-500"
          )}
        />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <div className="font-semibold text-red-800">{totalErrors}</div>
            <div className="text-sm text-red-600">Errors</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <div>
            <div className="font-semibold text-orange-800">{totalWarnings}</div>
            <div className="text-sm text-orange-600">Warnings</div>
          </div>
        </div>
      </div>
    </>
  )
}
