import { ValidationError, DataRow, DataType } from './types'

/**
 * Finds duplicate IDs within a dataset
 */
export function findDuplicateIDs(
  data: DataRow[],
  idColumn: string,
  dataType: DataType
): ValidationError[] {
  const errors: ValidationError[] = []
  const seen = new Map<string, number[]>()
  
  data.forEach((row, index) => {
    const id = row[idColumn]
    if (!id || typeof id !== 'string') return
    
    const normalizedId = id.trim().toLowerCase()
    if (!seen.has(normalizedId)) {
      seen.set(normalizedId, [])
    }
    seen.get(normalizedId)!.push(index)
  })
  
  seen.forEach((indices, id) => {
    if (indices.length > 1) {
      indices.forEach(rowIndex => {
        errors.push({
          type: 'error',
          category: 'duplicate',
          severity: 'high',
          dataType,
          row: rowIndex,
          column: idColumn,
          message: `Duplicate ID "${id}" found`,
          value: data[rowIndex][idColumn],
          suggestion: `Each ${dataType.slice(0, -1)} must have a unique ID`
        })
      })
    }
  })
  
  return errors
}

/**
 * Validates duplicate IDs for all data types
 */
export function validateDuplicateIDs(
  clients?: DataRow[],
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (clients) {
    errors.push(...findDuplicateIDs(clients, 'clientid', 'clients'))
  }
  
  if (workers) {
    errors.push(...findDuplicateIDs(workers, 'workerid', 'workers'))
  }
  
  if (tasks) {
    errors.push(...findDuplicateIDs(tasks, 'taskid', 'tasks'))
  }
  
  return errors
}
