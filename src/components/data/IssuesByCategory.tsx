'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Database, 
  Users 
} from 'lucide-react'

interface IssuesByCategoryProps {
  errorsByCategory: Record<string, number>
}

const categoryIcons: Record<string, React.ReactNode> = {
  duplicate: <Copy className="h-4 w-4" />,
  required: <AlertTriangle className="h-4 w-4" />,
  reference: <Target className="h-4 w-4" />,
  skill: <TrendingUp className="h-4 w-4" />,
  datatype: <Database className="h-4 w-4" />,
  business: <Users className="h-4 w-4" />
}

const categoryNames: Record<string, string> = {
  duplicate: 'Duplicate IDs',
  required: 'Missing Required',
  reference: 'Invalid References',
  skill: 'Skill Coverage',
  datatype: 'Data Types',
  business: 'Business Logic'
}

export const IssuesByCategory: React.FC<IssuesByCategoryProps> = ({ errorsByCategory }) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">Issues by Category</h4>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(errorsByCategory).map(([category, count]) => (
          <div 
            key={category}
            className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {categoryIcons[category]}
              <span className="text-sm">{categoryNames[category]}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {count}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
