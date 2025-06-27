export interface ValidationError {
  type: 'error' | 'warning'
  category: 'duplicate' | 'required' | 'reference' | 'skill' | 'datatype' | 'business'
  severity: 'high' | 'medium' | 'low'
  dataType: 'clients' | 'workers' | 'tasks'
  row: number
  column: string
  message: string
  value?: any
  suggestion?: string
}

export interface ValidationSummary {
  totalErrors: number
  totalWarnings: number
  errorsByCategory: Record<string, number>
  criticalIssues: ValidationError[]
  allErrors: ValidationError[]
}

export type DataRow = Record<string, any>
export type DataType = 'clients' | 'workers' | 'tasks'
export type ValidatorFunction = (
  data: DataRow[],
  dataType: DataType,
  allData?: { clients?: DataRow[], workers?: DataRow[], tasks?: DataRow[] }
) => ValidationError[]
