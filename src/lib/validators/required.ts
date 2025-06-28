import { ValidationError, DataRow, DataType } from './types'

/**
 * Validates required fields for a given dataset
 */
export function validateRequiredFields(
  data: DataRow[],
  requiredFields: string[],
  dataType: DataType
): ValidationError[] {
  const errors: ValidationError[] = []
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      const value = row[field]
      const isEmpty = value === null || value === undefined || 
                     (typeof value === 'string' && value.trim() === '')
      
      if (isEmpty) {
        errors.push({
          type: 'error',
          category: 'required',
          severity: 'high',
          dataType,
          row: index,
          column: field,
          message: `Required field "${field}" is empty`,
          value,
          suggestion: `Please provide a value for ${field}`
        })
      }
    })
  })
  
  return errors
}

/**
 * Validates required fields for all data types
 */
export function validateAllRequiredFields(
  clients?: DataRow[],
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Required fields for each data type (using normalized field names)
  const requiredFields = {
    clients: ['clientId', 'clientName', 'requirements', 'priority'],
    workers: ['workerId', 'name', 'skills', 'availability', 'rate'],
    tasks: ['taskId', 'clientId', 'duration', 'skills', 'deadline']
  }
  
  if (clients) {
    errors.push(...validateRequiredFields(clients, requiredFields.clients, 'clients'))
  }
  
  if (workers) {
    errors.push(...validateRequiredFields(workers, requiredFields.workers, 'workers'))
  }
  
  if (tasks) {
    errors.push(...validateRequiredFields(tasks, requiredFields.tasks, 'tasks'))
  }
  
  return errors
}
