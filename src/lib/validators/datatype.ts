import { ValidationError, DataRow, DataType } from './types'

/**
 * Helper function to create validation errors with auto-fix metadata
 */
function createValidationError(
  baseError: Omit<ValidationError, 'autoFixable' | 'fixType'>,
  autoFixable: boolean = false,
  fixType: 'auto' | 'manual' | 'conditional' = 'manual',
  fixReason?: string
): ValidationError {
  return {
    ...baseError,
    autoFixable,
    fixType,
    fixReason
  }
}

/**
 * Validates numeric values and ranges
 */
export function validateNumericFields(
  data: DataRow[],
  dataType: DataType
): ValidationError[] {
  const errors: ValidationError[] = []
  
  data.forEach((row, index) => {
    // Validate specific numeric fields based on data type
    switch (dataType) {
      case 'workers':
        // Validate rate field
        if (row.rate !== undefined && row.rate !== null) {
          const rate = parseFloat(String(row.rate))
          if (isNaN(rate)) {
            errors.push(createValidationError({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'rate',
              message: `Invalid rate format: "${row.rate}"`,
              value: row.rate,
              suggestion: 'Rate should be a valid number (e.g., 25.50)'
            }, true, 'auto', 'Can extract numeric value from string'))
          } else if (rate < 0) {
            errors.push(createValidationError({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'rate',
              message: `Rate cannot be negative: ${rate}`,
              value: row.rate,
              suggestion: 'Rate should be a positive number'
            }))
          } else if (rate > 1000) {
            errors.push(createValidationError({
              type: 'warning',
              category: 'datatype',
              severity: 'low',
              dataType,
              row: index,
              column: 'rate',
              message: `Unusually high rate: $${rate}/hour`,
              value: row.rate,
              suggestion: 'Please verify this rate is correct'
            }))
          }
        }
        
        // Validate availability field
        if (row.availability !== undefined && row.availability !== null) {
          const availability = parseFloat(String(row.availability))
          if (isNaN(availability)) {
            errors.push({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'availability',
              message: `Invalid availability format: "${row.availability}"`,
              value: row.availability,
              suggestion: 'Availability should be a percentage (0-100)'
            })
          } else if (availability < 0 || availability > 100) {
            errors.push({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'availability',
              message: `Availability must be between 0-100%: ${availability}`,
              value: row.availability,
              suggestion: 'Enter availability as a percentage between 0 and 100'
            })
          }
        }
        break
        
      case 'tasks':
        // Validate duration field
        if (row.duration !== undefined && row.duration !== null) {
          const duration = parseFloat(String(row.duration))
          if (isNaN(duration)) {
            errors.push({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'duration',
              message: `Invalid duration format: "${row.duration}"`,
              value: row.duration,
              suggestion: 'Duration should be a number of hours (e.g., 8.5)'
            })
          } else if (duration <= 0) {
            errors.push({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'duration',
              message: `Duration must be positive: ${duration}`,
              value: row.duration,
              suggestion: 'Enter duration as positive hours'
            })
          } else if (duration > 168) { // More than a week
            errors.push({
              type: 'warning',
              category: 'datatype',
              severity: 'low',
              dataType,
              row: index,
              column: 'duration',
              message: `Very long task duration: ${duration} hours`,
              value: row.duration,
              suggestion: 'Consider breaking down long tasks into smaller ones'
            })
          }
        }
        break
        
      case 'clients':
        // Validate priority field
        if (row.priority !== undefined && row.priority !== null) {
          const priorityStr = row.priority.toString().toLowerCase()
          const validPriorities = ['low', 'medium', 'high', 'critical']
          
          if (!validPriorities.includes(priorityStr)) {
            errors.push({
              type: 'error',
              category: 'datatype',
              severity: 'medium',
              dataType,
              row: index,
              column: 'priority',
              message: `Invalid priority value: "${row.priority}"`,
              value: row.priority,
              suggestion: 'Priority must be one of: Low, Medium, High, Critical'
            })
          }
        }
        break
    }
  })
  
  return errors
}

/**
 * Validates date formats and ranges
 */
export function validateDateFields(
  data: DataRow[],
  dataType: DataType
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (dataType !== 'tasks') return errors
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  data.forEach((row, index) => {
    if (row.deadline !== undefined && row.deadline !== null) {
      const deadlineStr = row.deadline.toString()
      const deadline = new Date(deadlineStr)
      
      // Check if date is valid
      if (isNaN(deadline.getTime())) {
        errors.push({
          type: 'error',
          category: 'datatype',
          severity: 'high',
          dataType,
          row: index,
          column: 'deadline',
          message: `Invalid date format: "${deadlineStr}"`,
          value: row.deadline,
          suggestion: 'Use format: YYYY-MM-DD or MM/DD/YYYY'
        })
      } else if (deadline < today) {
        errors.push({
          type: 'warning',
          category: 'datatype',
          severity: 'medium',
          dataType,
          row: index,
          column: 'deadline',
          message: `Task deadline is in the past: ${deadlineStr}`,
          value: row.deadline,
          suggestion: 'Consider updating the deadline or marking task as overdue'
        })
      }
    }
  })
  
  return errors
}
