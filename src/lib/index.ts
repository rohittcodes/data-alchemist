// Core library exports
export * from './types'
export * from './utils'
export * from './data'
export * from './storage'

// Validation exports (with explicit re-exports to avoid conflicts)
export { 
  validateData, 
  getErrorsForDataType,
  type ValidationSummary 
} from './validators'
export type { ValidationError } from './validators/types'
