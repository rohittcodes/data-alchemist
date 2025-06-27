import { ValidationError, DataRow } from './types'

/**
 * Validates business logic rules across the dataset
 */
export function validateBusinessLogic(
  clients?: DataRow[],
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (clients && tasks) {
    errors.push(...validateClientTaskRelationships(clients, tasks))
  }
  
  if (workers && tasks) {
    errors.push(...validateWorkerTaskCapacity(workers, tasks))
  }
  
  if (clients) {
    errors.push(...validateClientPriorityRules(clients))
  }
  
  return errors
}

/**
 * Validates client-task relationships and business rules
 */
function validateClientTaskRelationships(
  clients: DataRow[],
  tasks: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Check for high-priority clients without tasks
  clients.forEach((client, index) => {
    const priority = client.priority?.toString().toLowerCase()
    const clientId = client.clientid?.toString().toLowerCase().trim()
    
    if ((priority === 'high' || priority === 'critical') && clientId) {
      const clientTasks = tasks.filter(task => 
        task.clientid?.toString().toLowerCase().trim() === clientId
      )
      
      if (clientTasks.length === 0) {
        errors.push({
          type: 'warning',
          category: 'business',
          severity: priority === 'critical' ? 'high' : 'medium',
          dataType: 'clients',
          row: index,
          column: 'priority',
          message: `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority client "${client.clientname}" has no assigned tasks`,
          value: client.priority,
          suggestion: 'Assign tasks to high-priority clients or adjust their priority'
        })
      }
    }
  })
  
  // Check for clients with too many tasks
  const taskCountByClient = new Map<string, number>()
  tasks.forEach(task => {
    const clientId = task.clientid?.toString().toLowerCase().trim()
    if (clientId) {
      taskCountByClient.set(clientId, (taskCountByClient.get(clientId) || 0) + 1)
    }
  })
  
  clients.forEach((client, index) => {
    const clientId = client.clientid?.toString().toLowerCase().trim()
    const taskCount = taskCountByClient.get(clientId) || 0
    
    if (taskCount > 10) {
      errors.push({
        type: 'warning',
        category: 'business',
        severity: 'low',
        dataType: 'clients',
        row: index,
        column: 'clientid',
        message: `Client "${client.clientname}" has ${taskCount} tasks assigned`,
        value: client.clientid,
        suggestion: 'Consider redistributing tasks or reviewing client scope'
      })
    }
  })
  
  return errors
}

/**
 * Validates worker capacity and task assignment logic
 */
function validateWorkerTaskCapacity(
  workers: DataRow[],
  tasks: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Calculate total task duration
  const totalTaskHours = tasks.reduce((sum, task) => {
    const duration = parseFloat(task.duration) || 0
    return sum + duration
  }, 0)
  
  // Calculate total worker capacity
  const totalWorkerHours = workers.reduce((sum, worker) => {
    const availability = parseFloat(worker.availability) || 0
    // Assume 40-hour work week and availability is percentage
    const weeklyHours = (40 * availability) / 100
    return sum + weeklyHours
  }, 0)
  
  // Check if there's enough capacity
  if (totalTaskHours > totalWorkerHours * 1.2) { // 20% buffer
    errors.push({
      type: 'warning',
      category: 'business',
      severity: 'high',
      dataType: 'tasks',
      row: 0,
      column: 'duration',
      message: `Total task duration (${totalTaskHours.toFixed(1)}h) exceeds worker capacity (${totalWorkerHours.toFixed(1)}h/week)`,
      value: totalTaskHours,
      suggestion: 'Consider hiring more workers, reducing task scope, or extending deadlines'
    })
  }
  
  return errors
}

/**
 * Validates client priority distribution and business rules
 */
function validateClientPriorityRules(clients: DataRow[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  const priorityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }
  
  clients.forEach(client => {
    const priority = client.priority?.toString().toLowerCase()
    if (priority && priority in priorityCounts) {
      priorityCounts[priority as keyof typeof priorityCounts]++
    }
  })
  
  const total = clients.length
  const criticalPercent = (priorityCounts.critical / total) * 100
  
  // Too many critical priority clients
  if (criticalPercent > 20) {
    errors.push({
      type: 'warning',
      category: 'business',
      severity: 'medium',
      dataType: 'clients',
      row: 0,
      column: 'priority',
      message: `${criticalPercent.toFixed(1)}% of clients marked as critical priority`,
      value: 'critical',
      suggestion: 'Review client priorities - too many critical clients may indicate poor prioritization'
    })
  }
  
  return errors
}
