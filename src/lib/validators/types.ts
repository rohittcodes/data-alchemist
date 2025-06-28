export interface ValidationError {
  type: 'error' | 'warning'
  category: 'duplicate' | 'required' | 'reference' | 'skill' | 'datatype' | 'business'
  severity: 'high' | 'medium' | 'low'
  dataType: 'clients' | 'workers' | 'tasks'
  row: number
  column: string
  message: string
  value?: string | number | boolean | null
  suggestion?: string
  autoFixable?: boolean
  fixType?: 'auto' | 'manual' | 'conditional'
  fixReason?: string
  autoFixValue?: string | number | boolean | null
}

export interface ValidationSummary {
  totalErrors: number
  totalWarnings: number
  errorsByCategory: Record<string, number>
  criticalIssues: ValidationError[]
  allErrors: ValidationError[]
}

export type DataRow = Record<string, string | number | boolean | null>
export type DataType = 'clients' | 'workers' | 'tasks'
export type ValidatorFunction = (
  data: DataRow[],
  dataType: DataType,
  allData?: { clients?: DataRow[], workers?: DataRow[], tasks?: DataRow[] }
) => ValidationError[]
