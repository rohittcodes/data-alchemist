// Auto-fix utilities for simple validation errors
import type { ValidationError, DataRow } from './types'

export interface AutoFixResult {
  success: boolean
  fixedValue?: string | number | boolean | null
  reason: string
  requiresManualReview?: boolean
}

export interface AutoFixSummary {
  totalAttempted: number
  totalFixed: number
  totalRequireManual: number
  fixedErrors: ValidationError[]
  manualErrors: ValidationError[]
}

/**
 * Determine if a validation error can be automatically fixed
 */
export function canAutoFix(error: ValidationError): boolean {
  console.log('canAutoFix checking error:', {
    category: error.category,
    severity: error.severity,
    type: error.type,
    message: error.message
  })
  
  // Simple data type and formatting issues can be auto-fixed (including warnings)
  if (error.category === 'datatype') {
    // Duration warnings (like "Very long task duration") require manual review - CHECK FIRST
    if (error.message?.includes('duration') && (error.message?.includes('long') || error.message?.includes('Very long'))) {
      console.log('canAutoFix: long duration warning - NOT FIXABLE (business decision)')
      return false
    }
    
    // Task duration warnings with "hours" also require manual review
    if (error.message?.includes('task duration') && error.message?.includes('hours')) {
      console.log('canAutoFix: task duration warning - NOT FIXABLE (business decision)')
      return false
    }
    
    // Availability format errors require manual review (cannot auto-convert schedules to percentages)
    if (error.message?.includes('availability format') || (error.column === 'availability' && error.message?.includes('Invalid'))) {
      console.log('canAutoFix: availability format error - NOT FIXABLE (requires manual conversion)')
      return false
    }
    
    // Special handling for past deadline warnings
    if (error.message?.includes('deadline is in the past')) {
      console.log('canAutoFix: past deadline warning - FIXABLE')
      return true
    }
    
    // Number formatting issues
    if (error.message?.includes('number') || error.message?.includes('numeric')) {
      console.log('canAutoFix: numeric formatting issue - FIXABLE')
      return true
    }
    
    // Boolean formatting issues
    if (error.message?.includes('boolean')) {
      console.log('canAutoFix: boolean formatting issue - FIXABLE')
      return true
    }
    
    // Date formatting issues
    if (error.message?.includes('date')) {
      console.log('canAutoFix: date formatting issue - FIXABLE')
      return true
    }
    
    // Other datatype issues that aren't high severity
    if (error.severity !== 'high') {
      console.log('canAutoFix: datatype with non-high severity - FIXABLE')
      return true
    }
    
    console.log('canAutoFix: high severity datatype - considering manual review')
  }
  
  // Simple required field issues with obvious defaults
  if (error.category === 'required' && hasSimpleDefault(error)) {
    console.log('canAutoFix: required field with simple default - FIXABLE')
    return true
  }
  
  // Duplicate detection can be auto-fixed with incremental naming (expand to medium severity too)
  if (error.category === 'duplicate' && ['low', 'medium'].includes(error.severity)) {
    console.log('canAutoFix: low/medium severity duplicate - FIXABLE')
    return true
  }
  
  // Some reference errors can be auto-fixed (like missing default references)
  if (error.category === 'reference' && error.severity === 'low') {
    console.log('canAutoFix: low severity reference - FIXABLE')
    return true
  }
  
  // Business logic and complex references need manual intervention
  if (error.category === 'business' || error.category === 'skill') {
    console.log('canAutoFix: business/skill category - NOT FIXABLE')
    return false
  }
  
  // High severity reference issues need manual review
  if (error.category === 'reference' && error.severity === 'high') {
    console.log('canAutoFix: high severity reference - NOT FIXABLE')
    return false
  }

  const result = error.autoFixable || false
  console.log('canAutoFix: using error.autoFixable value:', result)
  return result
}

/**
 * Check if a required field error has a simple default value
 */
function hasSimpleDefault(error: ValidationError): boolean {
  const simpleDefaults: Record<string, boolean> = {
    // Priority fields
    'priority': true,
    'Priority': true,
    
    // Availability fields  
    'availability': true,
    'Availability': true,
    
    // Status fields
    'status': true,
    'Status': true,
    
    // Requirements can have basic defaults
    'requirements': true,
    'Requirements': true,
    
    // Skills can have basic defaults
    'skills': true,
    'Skills': true,
    
    // Description fields can have defaults
    'description': true,
    'Description': true,
    
    // Location fields can have defaults
    'location': true,
    'Location': true,
    
    // Company/organization fields
    'company': true,
    'Company': true,
    'department': true,
    'Department': true,
    
    // These need manual input - critical business data
    'duration': false,
    'Duration': false,
    'rate': false,
    'Rate': false,
    'deadline': false,
    'Deadline': false,
    'clientId': false,  // ID fields should not be auto-generated
    'workerId': false,
    'taskId': false,
    'client_id': false,
    'worker_id': false,
    'task_id': false,
    
    // Personal/contact info needs manual input
    'email': false,
    'phone': false,
    'address': false
  }
  
  return simpleDefaults[error.column] || false
}

/**
 * Automatically fix simple validation errors
 */
export function autoFixError(error: ValidationError, rowData: DataRow): AutoFixResult {
  console.log('autoFixError called with:', {
    error: {
      category: error.category,
      severity: error.severity,
      column: error.column,
      message: error.message,
      value: error.value,
      dataType: error.dataType
    },
    rowData: rowData,
    currentValue: rowData[error.column]
  })
  
  if (!canAutoFix(error)) {
    console.log('canAutoFix returned false for error:', error.category)
    return {
      success: false,
      reason: `${error.category} errors require manual intervention`,
      requiresManualReview: true
    }
  }
  
  switch (error.category) {
    case 'datatype':
      const datatypeResult = fixDataTypeError(error, rowData)
      console.log('datatype fix result:', datatypeResult)
      return datatypeResult
    
    case 'required':
      const requiredResult = fixRequiredFieldError(error, rowData)
      console.log('required fix result:', requiredResult)
      return requiredResult
    
    case 'duplicate':
      const duplicateResult = fixDuplicateError(error, rowData)
      console.log('duplicate fix result:', duplicateResult)
      return duplicateResult
    
    case 'reference':
      const referenceResult = fixReferenceError(error, rowData)
      console.log('reference fix result:', referenceResult)
      return referenceResult
    
    default:
      console.log('No auto-fix available for category:', error.category)
      return {
        success: false,
        reason: 'No auto-fix available for this error type',
        requiresManualReview: true
      }
  }
}

/**
 * Fix data type validation errors
 */
function fixDataTypeError(error: ValidationError, rowData: DataRow): AutoFixResult {
  const value = error.value || rowData[error.column]
  
  console.log('fixDataTypeError called with:', {
    errorValue: error.value,
    rowValue: rowData[error.column],
    usingValue: value,
    message: error.message,
    column: error.column
  })
  
  // Duration warnings require business logic decisions - cannot auto-fix
  if (error.message.includes('duration') && error.message.includes('long')) {
    console.log('Duration warning detected - requires manual review')
    return {
      success: false,
      reason: 'Duration optimization requires business decision - manual review needed',
      requiresManualReview: true
    }
  }
  
  // Fix numeric fields
  if (error.message.includes('number') || error.message.includes('numeric')) {
    console.log('Attempting numeric fix for:', value)
    if (typeof value === 'string') {
      // Remove non-numeric characters except decimal point
      const cleaned = value.replace(/[^\d.-]/g, '')
      const number = parseFloat(cleaned)
      
      if (!isNaN(number)) {
        console.log('Successfully converted to number:', number)
        return {
          success: true,
          fixedValue: number,
          reason: `Converted "${value}" to number ${number}`
        }
      } else {
        console.log('Failed to convert to number, cleaned value:', cleaned)
      }
    } else {
      console.log('Value is not a string, type:', typeof value, 'value:', value)
    }
    
    // Default to 0 for invalid numbers in non-critical fields
    if (!['rate', 'duration'].includes(error.column)) {
      console.log('Defaulting to 0 for non-critical field')
      return {
        success: true,
        fixedValue: 0,
        reason: `Set invalid number to 0 (requires verification)`
      }
    } else {
      console.log('Critical field, cannot default to 0')
    }
  }
  
  // Fix boolean fields
  if (error.message.includes('boolean')) {
    console.log('Attempting boolean fix for:', value)
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      if (['true', 'yes', '1', 'active', 'available'].includes(lower)) {
        return {
          success: true,
          fixedValue: true,
          reason: `Converted "${value}" to true`
        }
      }
      if (['false', 'no', '0', 'inactive', 'unavailable'].includes(lower)) {
        return {
          success: true,
          fixedValue: false,
          reason: `Converted "${value}" to false`
        }
      }
    }
  }
  
  // Fix date formats and past deadlines
  if (error.message.includes('date') || error.message.includes('deadline')) {
    console.log('Attempting date/deadline fix for:', value)
    
    // Handle past deadline warnings by setting to a reasonable future date
    if (error.message.includes('deadline is in the past')) {
      console.log('Fixing past deadline')
      const today = new Date()
      const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const futureDateString = futureDate.toISOString().split('T')[0]
      
      return {
        success: true,
        fixedValue: futureDateString,
        reason: `Updated past deadline to future date: ${futureDateString}`
      }
    }
    
    // Handle general date formatting
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return {
          success: true,
          fixedValue: date.toISOString().split('T')[0],
          reason: `Standardized date format`
        }
      }
    }
  }
  
  return {
    success: false,
    reason: 'Cannot automatically fix this data type error',
    requiresManualReview: true
  }
}

/**
 * Fix required field errors with safe defaults
 */
function fixRequiredFieldError(error: ValidationError, rowData: DataRow): AutoFixResult {
  console.log('fixRequiredFieldError called with:', {
    column: error.column,
    rowData: rowData,
    currentValue: rowData[error.column],
    hasSimpleDefault: hasSimpleDefault(error)
  })
  
  // Updated field defaults to match normalized field names
  const fieldDefaults: Record<string, any> = {
    // Priority fields (various forms)
    'priority': 2,
    'Priority': 2,
    
    // Availability fields
    'availability': 'available',
    'Availability': 'available',
    
    // Status fields
    'status': 'active',
    'Status': 'active',
    
    // Common defaults for other required fields
    'requirements': 'To be determined',
    'Requirements': 'To be determined',
    
    // Skill fields with basic defaults
    'skills': 'General',
    'Skills': 'General',
    
    // Description fields
    'description': 'No description provided',
    'Description': 'No description provided',
    
    // Location fields
    'location': 'Remote',
    'Location': 'Remote',
    
    // Company/organization fields
    'company': 'TBD',
    'Company': 'TBD',
    'department': 'General',
    'Department': 'General',
    
    // Boolean fields
    'active': true,
    'Active': true,
    'available': true,
    'Available': true
  }
  
  const defaultValue = fieldDefaults[error.column]
  console.log('Looking for default for column:', error.column, 'found:', defaultValue)
  
  if (defaultValue !== undefined) {
    console.log('Applying default value:', defaultValue)
    return {
      success: true,
      fixedValue: defaultValue,
      reason: `Set safe default value for required field: ${defaultValue}`
    }
  }
  
  console.log('No default value available for column:', error.column)
  console.log('Available defaults:', Object.keys(fieldDefaults))
  
  return {
    success: false,
    reason: 'Required field needs manual input - no safe default available',
    requiresManualReview: true
  }
}

/**
 * Fix duplicate errors by making values unique
 */
function fixDuplicateError(error: ValidationError, rowData: DataRow): AutoFixResult {
  const value = error.value || rowData[error.column]
  
  console.log('fixDuplicateError called with:', { value, column: error.column, row: error.row })
  
  if (typeof value === 'string') {
    // For names, append a number
    if (error.column.includes('name') || error.column.includes('Name')) {
      const timestamp = Date.now().toString().slice(-3) // Last 3 digits for shorter suffix
      return {
        success: true,
        fixedValue: `${value}_${timestamp}`,
        reason: 'Made name unique by appending identifier'
      }
    }
    
    // For IDs, increment or append
    if (error.column.includes('id') || error.column.includes('Id') || error.column.includes('ID')) {
      const numMatch = value.match(/\d+/)
      if (numMatch) {
        const newId = value.replace(/\d+/, String(parseInt(numMatch[0]) + 1))
        return {
          success: true,
          fixedValue: newId,
          reason: 'Incremented ID to make unique'
        }
      } else {
        // No number found, append one
        return {
          success: true,
          fixedValue: `${value}_${error.row + 1}`,
          reason: 'Added number to make ID unique'
        }
      }
    }
    
    // General case: append row number to make unique
    return {
      success: true,
      fixedValue: `${value}_${error.row + 1}`,
      reason: 'Added identifier to resolve duplicate'
    }
  }
  
  if (typeof value === 'number') {
    // For numeric values, increment by 1
    return {
      success: true,
      fixedValue: value + 1,
      reason: 'Incremented number to make unique'
    }
  }
  
  return {
    success: false,
    reason: 'Duplicate resolution requires manual review',
    requiresManualReview: true
  }
}

/**
 * Fix simple reference errors
 */
function fixReferenceError(error: ValidationError, rowData: DataRow): AutoFixResult {
  const value = error.value || rowData[error.column]
  
  console.log('fixReferenceError called with:', { value, column: error.column, severity: error.severity })
  
  // Only fix low-severity reference issues
  if (error.severity !== 'low') {
    return {
      success: false,
      reason: 'Reference validation requires manual verification',
      requiresManualReview: true
    }
  }
  
  // If the field is empty or null, provide a default reference
  if (!value || value === '' || value === null || value === undefined) {
    // Common default references based on field name
    const fieldDefaults: Record<string, any> = {
      'client_id': 'default_client',
      'clientId': 'default_client',
      'worker_id': 'default_worker',
      'workerId': 'default_worker',
      'task_id': 'default_task',
      'taskId': 'default_task',
      'assigned_to': 'unassigned',
      'assignedTo': 'unassigned'
    }
    
    const defaultValue = fieldDefaults[error.column]
    if (defaultValue) {
      return {
        success: true,
        fixedValue: defaultValue,
        reason: `Set default reference value for ${error.column}`
      }
    }
  }
  
  // Try to fix common reference format issues
  if (typeof value === 'string') {
    // Remove extra whitespace
    const trimmed = value.trim()
    if (trimmed !== value) {
      return {
        success: true,
        fixedValue: trimmed,
        reason: 'Removed extra whitespace from reference'
      }
    }
    
    // Fix case issues for common patterns
    if (value.toLowerCase().includes('client') && !value.includes('client')) {
      return {
        success: true,
        fixedValue: value.toLowerCase().replace(/client/i, 'client'),
        reason: 'Fixed reference format'
      }
    }
  }
  
  return {
    success: false,
    reason: 'Reference validation requires manual verification',
    requiresManualReview: true
  }
}

/**
 * Apply auto-fixes to a dataset
 */
export function applyAutoFixes(
  data: DataRow[],
  errors: ValidationError[]
): AutoFixSummary {
  console.log('applyAutoFixes called with:', {
    dataLength: data.length,
    errorsLength: errors.length,
    sampleData: data[0],
    sampleErrors: errors.slice(0, 3)
  })
  
  const summary: AutoFixSummary = {
    totalAttempted: 0,
    totalFixed: 0,
    totalRequireManual: 0,
    fixedErrors: [],
    manualErrors: []
  }
  
  for (const error of errors) {
    summary.totalAttempted++
    
    console.log(`Processing error ${summary.totalAttempted}:`, {
      category: error.category,
      severity: error.severity,
      row: error.row,
      column: error.column,
      message: error.message,
      canAutoFix: canAutoFix(error)
    })
    
    if (!canAutoFix(error)) {
      summary.totalRequireManual++
      summary.manualErrors.push(error)
      console.log('Error cannot be auto-fixed:', error.message)
      continue
    }
    
    const rowData = data[error.row]
    if (!rowData) {
      console.log(`Row ${error.row} not found in data (data length: ${data.length})`)
      summary.totalRequireManual++
      summary.manualErrors.push(error)
      continue
    }
    
    console.log('Row data before fix:', { 
      row: error.row, 
      column: error.column, 
      currentValue: rowData[error.column],
      rowData: rowData
    })
    
    const fixResult = autoFixError(error, rowData)
    console.log('Fix result:', fixResult)
    
    if (fixResult.success && fixResult.fixedValue !== undefined) {
      // Apply the fix
      const oldValue = rowData[error.column]
      rowData[error.column] = fixResult.fixedValue
      summary.totalFixed++
      summary.fixedErrors.push({
        ...error,
        autoFixValue: fixResult.fixedValue,
        fixReason: fixResult.reason
      })
      console.log(`Applied fix: ${oldValue} → ${fixResult.fixedValue}`)
    } else {
      summary.totalRequireManual++
      summary.manualErrors.push(error)
      console.log('Fix failed or not applicable:', fixResult.reason)
    }
  }
  
  console.log('Auto-fix summary:', summary)
  return summary
}

/**
 * Get categorized fix recommendations
 */
export function getFixRecommendations(errors: ValidationError[]): {
  autoFixable: ValidationError[]
  manualReview: ValidationError[]
  businessDecisions: ValidationError[]
} {
  const autoFixable: ValidationError[] = []
  const manualReview: ValidationError[] = []
  const businessDecisions: ValidationError[] = []
  
  for (const error of errors) {
    if (error.category === 'business' || error.category === 'skill') {
      businessDecisions.push(error)
    } else if (canAutoFix(error)) {
      autoFixable.push(error)
    } else {
      manualReview.push(error)
    }
  }
  
  return { autoFixable, manualReview, businessDecisions }
}
