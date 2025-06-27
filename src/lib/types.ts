// Core data types for the Data Alchemist application

export interface Client {
  clientId: string
  clientName: string
  requirements: string
  priority: number
  // Additional fields that might be present in uploaded CSV
  email?: string
  phone?: string
  address?: string
  industry?: string
  budget?: number
  contact?: string
}

export interface Worker {
  workerId: string
  name: string
  skills: string
  availability: string
  rate: number
  // Additional fields that might be present in uploaded CSV
  email?: string
  phone?: string
  department?: string
  experience?: number
  certification?: string
  location?: string
}

export interface Task {
  taskId: string
  clientId: string
  duration: number
  skills: string
  deadline: string
  // Additional fields that might be present in uploaded CSV
  description?: string
  priority?: string
  status?: string
  assignedWorker?: string
  estimatedHours?: number
  actualHours?: number
}

export interface ValidationError {
  id: string
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  row?: number
  suggestion?: string
}

export interface Rule {
  id: string
  name: string
  type: 'co-run' | 'load-limit' | 'phase-window' | 'availability' | 'skill-match'
  description: string
  conditions: RuleConditions
  actions: RuleActions
  enabled: boolean
  createdAt: string
  modifiedAt: string
}

export interface RuleConditions {
  // Co-run rules
  tasks?: string[]
  mustRunTogether?: boolean
  // Load limit rules
  workerId?: string
  maxTasks?: number
  // Phase window rules
  phase?: string
  startDate?: string
  endDate?: string
  // Additional conditions
  skillRequirements?: string[]
  priorityLevel?: string
}

export interface RuleActions {
  // Actions to take when rule conditions are met
  blockScheduling?: boolean
  sendNotification?: boolean
  requireApproval?: boolean
  autoAssign?: boolean
  assignTo?: string
  // Additional actions
  escalateTo?: string
  logEvent?: boolean
}

export interface ProcessingStatus {
  stage: 'uploading' | 'parsing' | 'validating' | 'generating-rules' | 'completed' | 'error'
  progress: number
  message: string
  errors?: string[]
  warnings?: string[]
}

export interface ExportData {
  clients: Client[]
  workers: Worker[]
  tasks: Task[]
  rules: Rule[]
  validationReport: ValidationError[]
  metadata: ExportMetadata
}

export interface ExportMetadata {
  exportedAt: string
  sessionId: string
  totalRecords: number
  exportFormat: 'zip' | 'csv' | 'json'
  fileNames: string[]
}

// Parsed data structure from CSV/XLSX files
export interface ParsedData {
  headers: string[]
  rows: DataRow[]
  rowCount: number
  fileName: string
  fileSize: number
  fileType?: 'csv' | 'xlsx'
}

// Individual data row (replacing any[])
export type DataRow = Record<string, string | number | boolean | null>

// Session data structure
export interface SessionData {
  sessionId: string
  clients?: ParsedData
  workers?: ParsedData
  tasks?: ParsedData
  rules?: Rule[]
  created: number
  lastModified: number
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  uploadedFiles?: string[]
  validationSummary?: ValidationSummary
}

// Validation summary structure
export interface ValidationSummary {
  totalErrors: number
  totalWarnings: number
  errorsByCategory: Record<string, number>
  criticalIssues: ValidationError[]
  allErrors: ValidationError[]
}

// AI Search and filtering types
export interface SearchFilter {
  dataType: 'clients' | 'workers' | 'tasks'
  conditions: FilterCondition[]
  explanation?: string
}

export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
  value: string | number | string[] | number[]
}

export interface SearchResults {
  filter: SearchFilter
  filteredData: {
    clients?: DataRow[]
    workers?: DataRow[]
    tasks?: DataRow[]
  }
  summary: {
    totalFound: number
    breakdown: Record<string, number>
  }
}

// AI fix suggestion types
export interface FixSuggestion {
  id: string
  errorId: string
  type: 'value' | 'format' | 'reference' | 'calculation'
  description: string
  newValue: string | number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  alternatives?: string[]
}

// Component prop types
export interface TableCellEditEvent {
  rowIndex: number
  columnId: string
  value: string | number
  oldValue: string | number
}