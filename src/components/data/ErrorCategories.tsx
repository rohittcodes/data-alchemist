'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Settings, UserX } from 'lucide-react'

interface ErrorCategory {
  manualReview: number
  businessDecisions: number
}

interface ErrorCategoriesProps {
  categories: ErrorCategory
}

export const ErrorCategories: React.FC<ErrorCategoriesProps> = ({ categories }) => {
  return (
    <div className="space-y-3">
      {/* Manual Review Required */}
      {categories.manualReview > 0 && (
        <div className="border rounded-lg p-4 bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-800">Manual Review Required</span>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {categories.manualReview}
            </Badge>
          </div>
          <p className="text-sm text-orange-700">
            Complex issues that need your attention and decision-making
          </p>
        </div>
      )}
      
      {/* Business Decisions */}
      {categories.businessDecisions > 0 && (
        <div className="border rounded-lg p-4 bg-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-800">Business Decisions</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {categories.businessDecisions}
            </Badge>
          </div>
          <p className="text-sm text-purple-700">
            Skill matching, hiring decisions, and business logic that requires human expertise
          </p>
        </div>
      )}
    </div>
  )
}
