'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Link, 
  Clock, 
  Users, 
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react'

export interface Rule {
  id: string
  type: 'coRun' | 'loadLimit' | 'phaseWindow'
  description: string
  status: 'active' | 'inactive' | 'error'
  created: number
  // Rule-specific data
  tasks?: string[]
  workers?: string[]
  maxLoad?: number
  startDate?: string
  endDate?: string
  phase?: string
}

interface RuleBuilderProps {
  sessionId: string
  availableTasks?: { id: string; title: string }[]
  availableWorkers?: { id: string; name: string }[]
  onRulesUpdated?: (rules: Rule[]) => void
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  sessionId,
  availableTasks = [],
  availableWorkers = [],
  onRulesUpdated
}) => {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Form states for different rule types
  const [coRunTasks, setCoRunTasks] = useState<string[]>([])
  const [loadLimitWorker, setLoadLimitWorker] = useState('')
  const [maxLoad, setMaxLoad] = useState('')
  const [phaseStart, setPhaseStart] = useState('')
  const [phaseEnd, setPhaseEnd] = useState('')
  const [phaseName, setPhaseName] = useState('')
  
  // Natural language rule creation
  const [naturalLanguageText, setNaturalLanguageText] = useState('')
  const [aiProcessing, setAiProcessing] = useState(false)

  useEffect(() => {
    loadRules()
  }, [sessionId])

  const loadRules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/session/${sessionId}/rules`)
      if (response.ok) {
        const rulesData = await response.json()
        setRules(rulesData.rules || [])
        onRulesUpdated?.(rulesData.rules || [])
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveRule = async (rule: Omit<Rule, 'id' | 'created' | 'status'>) => {
    const newRule: Rule = {
      ...rule,
      id: crypto.randomUUID(),
      created: Date.now(),
      status: 'active'
    }

    try {
      const response = await fetch(`/api/session/${sessionId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: newRule })
      })

      if (response.ok) {
        const updatedRules = [...rules, newRule]
        setRules(updatedRules)
        onRulesUpdated?.(updatedRules)
        resetForms()
      } else {
        console.error('Failed to save rule')
      }
    } catch (error) {
      console.error('Error saving rule:', error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/session/${sessionId}/rules`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      })

      if (response.ok) {
        const updatedRules = rules.filter(rule => rule.id !== ruleId)
        setRules(updatedRules)
        onRulesUpdated?.(updatedRules)
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const createCoRunRule = async () => {
    if (coRunTasks.length < 2) return

    setCreating(true)
    try {
      const taskTitles = coRunTasks.map(taskId => 
        availableTasks.find(t => t.id === taskId)?.title || taskId
      ).join(', ')

      await saveRule({
        type: 'coRun',
        tasks: coRunTasks,
        description: `Tasks "${taskTitles}" must run together`
      })
    } finally {
      setCreating(false)
    }
  }

  const createLoadLimitRule = async () => {
    if (!loadLimitWorker || !maxLoad) return

    setCreating(true)
    try {
      const workerName = availableWorkers.find(w => w.id === loadLimitWorker)?.name || loadLimitWorker

      await saveRule({
        type: 'loadLimit',
        workers: [loadLimitWorker],
        maxLoad: parseInt(maxLoad),
        description: `Worker "${workerName}" maximum load: ${maxLoad} tasks`
      })
    } finally {
      setCreating(false)
    }
  }

  const createPhaseWindowRule = async () => {
    if (!phaseName || !phaseStart || !phaseEnd) return

    setCreating(true)
    try {
      await saveRule({
        type: 'phaseWindow',
        phase: phaseName,
        startDate: phaseStart,
        endDate: phaseEnd,
        description: `Phase "${phaseName}" runs from ${phaseStart} to ${phaseEnd}`
      })
    } finally {
      setCreating(false)
    }
  }

  const createFromNaturalLanguage = async () => {
    if (!naturalLanguageText.trim()) return

    setAiProcessing(true)
    try {
      const response = await fetch('/api/ai/create-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: naturalLanguageText, 
          sessionId,
          availableTasks: availableTasks.map(t => ({ id: t.id, title: t.title })),
          availableWorkers: availableWorkers.map(w => ({ id: w.id, name: w.name }))
        })
      })

      if (response.ok) {
        const { rule } = await response.json()
        await saveRule(rule)
        setNaturalLanguageText('')
      } else {
        console.error('Failed to create rule from natural language')
      }
    } catch (error) {
      console.error('Error creating rule from natural language:', error)
    } finally {
      setAiProcessing(false)
    }
  }

  const resetForms = () => {
    setCoRunTasks([])
    setLoadLimitWorker('')
    setMaxLoad('')
    setPhaseStart('')
    setPhaseEnd('')
    setPhaseName('')
  }

  const toggleTaskSelection = (taskId: string) => {
    setCoRunTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'coRun': return <Link className="h-4 w-4" />
      case 'loadLimit': return <Users className="h-4 w-4" />
      case 'phaseWindow': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getRuleColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading rules...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Rule Builder
          </CardTitle>
          <CardDescription>
            Create rules to manage task dependencies, worker constraints, and project phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forms" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="forms">Form Builder</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="forms" className="space-y-6">
              {/* Co-Run Rule Form */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Co-Run Tasks
                </h4>
                <p className="text-sm text-muted-foreground">
                  Specify tasks that must be executed together
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {availableTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => toggleTaskSelection(task.id)}
                        className={`p-2 text-sm border rounded text-left transition-colors ${
                          coRunTasks.includes(task.id)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {task.title || task.id}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={createCoRunRule}
                    disabled={coRunTasks.length < 2 || creating}
                    size="sm"
                  >
                    {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Create Co-Run Rule ({coRunTasks.length} tasks)
                  </Button>
                </div>
              </div>

              {/* Load Limit Rule Form */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Worker Load Limit
                </h4>
                <p className="text-sm text-muted-foreground">
                  Set maximum task load for specific workers
                </p>
                <div className="flex gap-2">
                  <select
                    value={loadLimitWorker}
                    onChange={(e) => setLoadLimitWorker(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                  >
                    <option value="">Select Worker</option>
                    {availableWorkers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Max load"
                    value={maxLoad}
                    onChange={(e) => setMaxLoad(e.target.value)}
                    className="w-24"
                  />
                  <Button
                    onClick={createLoadLimitRule}
                    disabled={!loadLimitWorker || !maxLoad || creating}
                    size="sm"
                  >
                    Create
                  </Button>
                </div>
              </div>

              {/* Phase Window Rule Form */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Phase Window
                </h4>
                <p className="text-sm text-muted-foreground">
                  Define time windows for project phases
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Phase name"
                    value={phaseName}
                    onChange={(e) => setPhaseName(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={phaseStart}
                    onChange={(e) => setPhaseStart(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={phaseEnd}
                    onChange={(e) => setPhaseEnd(e.target.value)}
                  />
                  <Button
                    onClick={createPhaseWindowRule}
                    disabled={!phaseName || !phaseStart || !phaseEnd || creating}
                    size="sm"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Natural Language Rules
                </h4>
                <p className="text-sm text-muted-foreground">
                  Describe your rule in plain English and let AI create it for you
                </p>
                <div className="space-y-2">
                  <textarea
                    placeholder="Example: 'Tasks A and B must run together' or 'John can only work on 3 tasks maximum' or 'Phase 1 runs from January to March'"
                    value={naturalLanguageText}
                    onChange={(e) => setNaturalLanguageText(e.target.value)}
                    className="w-full p-3 border rounded resize-none h-24"
                  />
                  <Button
                    onClick={createFromNaturalLanguage}
                    disabled={!naturalLanguageText.trim() || aiProcessing}
                    className="w-full"
                  >
                    {aiProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        AI is creating your rule...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Create Rule with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Rules Display */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules ({rules.length})</CardTitle>
          <CardDescription>
            Manage your current project rules and constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No rules created yet. Use the rule builder above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border ${getRuleColor(rule.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getRuleIcon(rule.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {rule.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rule.type}
                          </Badge>
                          <Badge 
                            variant={rule.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rule.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(rule.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
