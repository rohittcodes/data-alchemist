// Main validation engine that orchestrates all validation modules
export * from './types'
export * from './duplicate'
export * from './required'
export * from './references'
export * from './skills'
export * from './datatype'
export * from './business'

import { ValidationError, ValidationSummary, DataRow } from './types'
import { validateDuplicateIDs } from './duplicate'
import { validateAllRequiredFields } from './required'
import { validateReferences } from './references'
import { validateSkillCoverage, validateWorkerUtilization } from './skills'
import { validateNumericFields, validateDateFields } from './datatype'
import { validateBusinessLogic } from './business'
import { ParsedData } from '../data/parsers'

/**
 * Main validation function that runs all validation checks
 */
export function validateData(
  clientsData?: ParsedData,
  workersData?: ParsedData,
  tasksData?: ParsedData
): ValidationSummary {
  const clients = clientsData?.rows
  const workers = workersData?.rows
  const tasks = tasksData?.rows
  
  const allErrors: ValidationError[] = []
  
  // Run all validation checks
  allErrors.push(...validateDuplicateIDs(clients, workers, tasks))
  allErrors.push(...validateAllRequiredFields(clients, workers, tasks))
  allErrors.push(...validateReferences(clients, workers, tasks))
  allErrors.push(...validateSkillCoverage(workers, tasks))
  allErrors.push(...validateWorkerUtilization(workers, tasks))
  
  // Validate data types for each dataset
  if (clients) allErrors.push(...validateNumericFields(clients, 'clients'))
  if (workers) allErrors.push(...validateNumericFields(workers, 'workers'))
  if (tasks) {
    allErrors.push(...validateNumericFields(tasks, 'tasks'))
    allErrors.push(...validateDateFields(tasks, 'tasks'))
  }
  
  allErrors.push(...validateBusinessLogic(clients, workers, tasks))
  
  // Calculate summary statistics
  const totalErrors = allErrors.filter(e => e.type === 'error').length
  const totalWarnings = allErrors.filter(e => e.type === 'warning').length
  
  // Group errors by category
  const errorsByCategory: Record<string, number> = {}
  allErrors.forEach(error => {
    errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1
  })
  
  // Find critical issues (high severity errors)
  const criticalIssues = allErrors.filter(
    error => error.type === 'error' && error.severity === 'high'
  )
  
  return {
    totalErrors,
    totalWarnings,
    errorsByCategory,
    criticalIssues,
    allErrors
  }
}

/**
 * Helper function to get errors for a specific data type (for DataTable integration)
 */
export function getErrorsForDataType(
  errors: ValidationError[],
  dataType: 'clients' | 'workers' | 'tasks'
): ValidationError[] {
  return errors.filter(error => error.dataType === dataType)
}
