'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  BookOpen,
  UserPlus,
  Calendar,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react'
import { ValidationError } from '@/lib/validators/types'

interface FixRecommendationsProps {
  manualReviewErrors: ValidationError[]
  businessDecisionErrors: ValidationError[]
  sessionId: string
}

interface Recommendation {
  id: string
  category: 'skill-gap' | 'capacity' | 'quality' | 'reference' | 'business-rule'
  title: string
  description: string
  action: string
  timeline: string
  priority: 'high' | 'medium' | 'low'
  icon: React.ComponentType<any>
  color: string
}

function generateRecommendations(
  manualErrors: ValidationError[], 
  businessErrors: ValidationError[]
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Analyze skill-related errors
  const skillErrors = [...manualErrors, ...businessErrors].filter(e => 
    e.category === 'skill' || e.message.toLowerCase().includes('skill')
  )
  
  if (skillErrors.length > 0) {
    const missingSkills = new Set<string>()
    skillErrors.forEach(error => {
      // Extract skill mentions from error messages
      const skillMatch = error.message.match(/skill[s]?\s*['""]?([^'""\s,]+)/i)
      if (skillMatch) {
        missingSkills.add(skillMatch[1])
      }
    })

    missingSkills.forEach(skill => {
      recommendations.push({
        id: `skill-gap-${skill}`,
        category: 'skill-gap',
        title: `Skill Gap: ${skill}`,
        description: `No workers found with "${skill}" capability. This may impact project delivery.`,
        action: `Consider hiring a ${skill} specialist or training existing workers`,
        timeline: '2-4 weeks for training, 4-8 weeks for hiring',
        priority: 'high',
        icon: BookOpen,
        color: 'from-orange-500 to-red-600'
      })
    })
  }

  // Analyze capacity/workload errors
  const capacityErrors = [...manualErrors, ...businessErrors].filter(e => 
    e.message.toLowerCase().includes('capacity') || 
    e.message.toLowerCase().includes('overload') ||
    e.message.toLowerCase().includes('availability')
  )

  if (capacityErrors.length > 0) {
    recommendations.push({
      id: 'capacity-planning',
      category: 'capacity',
      title: 'Capacity Management',
      description: `${capacityErrors.length} capacity-related issues detected. Workers may be overallocated.`,
      action: 'Review worker schedules and consider load balancing or hiring additional staff',
      timeline: '1-2 weeks for rebalancing, 6-8 weeks for new hires',
      priority: 'medium',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600'
    })
  }

  // Analyze reference/data quality errors
  const dataQualityErrors = manualErrors.filter(e => 
    e.category === 'reference' || e.category === 'duplicate'
  )

  if (dataQualityErrors.length > 0) {
    recommendations.push({
      id: 'data-quality',
      category: 'quality',
      title: 'Data Quality Issues',
      description: `${dataQualityErrors.length} data consistency problems found.`,
      action: 'Review data entry processes and implement validation checks',
      timeline: '1-2 weeks for cleanup, ongoing process improvement',
      priority: 'medium',
      icon: CheckSquare,
      color: 'from-purple-500 to-pink-600'
    })
  }

  // Business logic recommendations
  const businessLogicErrors = businessErrors.filter(e => e.category === 'business')
  
  if (businessLogicErrors.length > 0) {
    recommendations.push({
      id: 'business-rules',
      category: 'business-rule',
      title: 'Business Rule Conflicts',
      description: `${businessLogicErrors.length} business logic violations detected.`,
      action: 'Review and update business rules or adjust project constraints',
      timeline: '1-3 weeks for rule refinement',
      priority: 'high',
      icon: Target,
      color: 'from-green-500 to-emerald-600'
    })
  }

  return recommendations
}

export const FixRecommendations: React.FC<FixRecommendationsProps> = ({
  manualReviewErrors,
  businessDecisionErrors,
  sessionId
}) => {
  const recommendations = generateRecommendations(manualReviewErrors, businessDecisionErrors)

  if (recommendations.length === 0) {
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Actionable Recommendations
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Strategic actions to resolve manual and business issues
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${rec.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <rec.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-white font-medium">{rec.title}</h4>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>
                
                <p className="text-gray-400 text-sm mb-3">
                  {rec.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-300 text-sm font-medium">
                      Action: {rec.action}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm">
                      Timeline: {rec.timeline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Action buttons */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex gap-3 flex-wrap">
            <Button
              size="sm"
              className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-blue-300"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Plan Hiring
            </Button>
            <Button
              size="sm"
              className="bg-green-600/20 hover:bg-green-600/30 border-green-500/50 text-green-300"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Schedule Training
            </Button>
            <Button
              size="sm"
              className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50 text-purple-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Review Timeline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
