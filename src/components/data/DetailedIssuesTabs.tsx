'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserCheck, Briefcase } from 'lucide-react'
import { ValidationError } from '@/lib'
import { ValidationErrorItem } from './ValidationErrorItem'

interface DetailedIssuesTabsProps {
  allErrors: ValidationError[]
  sessionId: string
  onJumpToError?: (error: ValidationError) => void
  onDataUpdated?: () => void
}

export const DetailedIssuesTabs: React.FC<DetailedIssuesTabsProps> = ({
  allErrors,
  sessionId,
  onJumpToError,
  onDataUpdated
}) => {
  return (
    <Tabs defaultValue="all" className="space-y-3">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All Issues</TabsTrigger>
        <TabsTrigger value="clients">
          <Users className="h-3 w-3 mr-1" />
          Clients
        </TabsTrigger>
        <TabsTrigger value="workers">
          <UserCheck className="h-3 w-3 mr-1" />
          Workers
        </TabsTrigger>
        <TabsTrigger value="tasks">
          <Briefcase className="h-3 w-3 mr-1" />
          Tasks
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="space-y-2 max-h-48 overflow-y-auto">
        {allErrors.map((error, index) => (
          <ValidationErrorItem 
            key={index} 
            error={error} 
            sessionId={sessionId}
            onJumpToError={onJumpToError}
            onFixApplied={onDataUpdated}
          />
        ))}
      </TabsContent>
      
      <TabsContent value="clients" className="space-y-2 max-h-48 overflow-y-auto">
        {allErrors
          .filter(error => error.dataType === 'clients')
          .map((error, index) => (
            <ValidationErrorItem 
              key={index} 
              error={error} 
              sessionId={sessionId}
              onJumpToError={onJumpToError}
              onFixApplied={onDataUpdated}
            />
          ))
        }
      </TabsContent>
      
      <TabsContent value="workers" className="space-y-2 max-h-48 overflow-y-auto">
        {allErrors
          .filter(error => error.dataType === 'workers')
          .map((error, index) => (
            <ValidationErrorItem 
              key={index} 
              error={error} 
              sessionId={sessionId}
              onJumpToError={onJumpToError}
              onFixApplied={onDataUpdated}
            />
          ))
        }
      </TabsContent>
      
      <TabsContent value="tasks" className="space-y-2 max-h-48 overflow-y-auto">
        {allErrors
          .filter(error => error.dataType === 'tasks')
          .map((error, index) => (
            <ValidationErrorItem 
              key={index} 
              error={error} 
              sessionId={sessionId}
              onJumpToError={onJumpToError}
              onFixApplied={onDataUpdated}
            />
          ))
        }
      </TabsContent>
    </Tabs>
  )
}
