import { ValidationError, DataRow } from './types'

/**
 * Validates references between datasets (foreign key integrity)
 */
export function validateReferences(
  clients?: DataRow[],
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!tasks || !clients) {
    return errors
  }
  
  // Create a set of valid client IDs for quick lookup
  const validClientIds = new Set(
    clients.map(client => client.clientid?.toString().toLowerCase().trim())
      .filter(Boolean)
  )
  
  // Check if each task references a valid client
  tasks.forEach((task, index) => {
    const clientId = task.clientid?.toString().toLowerCase().trim()
    
    if (clientId && !validClientIds.has(clientId)) {
      errors.push({
        type: 'error',
        category: 'reference',
        severity: 'high',
        dataType: 'tasks',
        row: index,
        column: 'clientid',
        message: `Task references non-existent client ID "${task.clientid}"`,
        value: task.clientid,
        suggestion: `Ensure the client ID exists in the clients dataset`
      })
    }
  })
  
  return errors
}
