// Core data types for the Data Alchemist application

export interface Client {
  clientId: string
  clientName: string
  requirements: string
  priority: number
  [key: string]: any
}

export interface Worker {
  workerId: string
  name: string
  skills: string
  availability: string
  rate: number
  [key: string]: any
}

export interface Task {
  taskId: string
  clientId: string
  duration: number
  skills: string
  deadline: string
  [key: string]: any
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
  conditions: Record<string, any>
  actions: Record<string, any>
  enabled: boolean
  createdAt: string
  modifiedAt: string
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
  metadata: {
    exportedAt: string
    sessionId: string
    totalRecords: number
  }
}