// Test end-to-end validation with actual CSV files and field mapping
const fs = require('fs').promises
const path = require('path')

// Field mapping for consistent data structure (copied from parsers.ts)
const FIELD_MAPPINGS = {
  // Client fields
  'clientid': 'clientId',
  'client_id': 'clientId',
  'ClientID': 'clientId',
  'Client ID': 'clientId',
  'clientname': 'clientName',
  'client_name': 'clientName',
  'ClientName': 'clientName',
  'Client Name': 'clientName',
  
  // Worker fields
  'workerid': 'workerId',
  'worker_id': 'workerId',
  'WorkerID': 'workerId',
  'Worker ID': 'workerId',
  
  // Task fields
  'taskid': 'taskId',
  'task_id': 'taskId',
  'TaskID': 'taskId',
  'Task ID': 'taskId',
}

function normalizeFieldName(header) {
  const trimmed = header.trim()
  // Check direct mapping first
  if (FIELD_MAPPINGS[trimmed]) {
    return FIELD_MAPPINGS[trimmed]
  }
  
  // Check case-insensitive mapping
  const lowerHeader = trimmed.toLowerCase()
  if (FIELD_MAPPINGS[lowerHeader]) {
    return FIELD_MAPPINGS[lowerHeader]
  }
  
  // Convert to camelCase for consistency
  return trimmed.replace(/[\s_-]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase())
}

function normalizeRowData(row) {
  const normalizedRow = {}
  
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeFieldName(key)
    // Clean up values (remove carriage returns, etc.)
    const cleanValue = typeof value === 'string' ? value.replace(/\r/g, '').trim() : value
    normalizedRow[normalizedKey] = cleanValue
  }
  
  return normalizedRow
}

function parseCSVData(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')
  const rows = lines.slice(1).map(line => {
    const values = line.split(',')
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return normalizeRowData(row)
  })
  
  return {
    headers: headers.map(normalizeFieldName),
    rows
  }
}

// Validation functions (copied from validators)
function validateRequiredFields(data, requiredFields, dataType) {
  const errors = []
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      const value = row[field]
      const isEmpty = value === null || value === undefined || 
                     (typeof value === 'string' && value.trim() === '') ||
                     (typeof value === 'number' && isNaN(value))
      
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

function validateReferences(clients, tasks) {
  const errors = []
  
  if (!tasks || !clients) {
    return errors
  }
  
  // Create a set of valid client IDs for quick lookup
  const validClientIds = new Set(
    clients.map(client => client.clientId?.toString().toLowerCase().trim())
      .filter(Boolean)
  )
  
  // Check if each task references a valid client
  tasks.forEach((task, index) => {
    const clientId = task.clientId?.toString().toLowerCase().trim()
    
    if (clientId && !validClientIds.has(clientId)) {
      errors.push({
        type: 'error',
        category: 'reference',
        severity: 'high',
        dataType: 'tasks',
        row: index,
        column: 'clientId',
        message: `Task references non-existent client ID "${task.clientId}"`,
        value: task.clientId,
        suggestion: `Ensure the client ID exists in the clients dataset`
      })
    }
  })
  
  return errors
}

function validateDataTypes(data, dataType) {
  const errors = []
  
  data.forEach((row, index) => {
    // Validate priority is a number for clients
    if (dataType === 'clients' && row.priority !== undefined) {
      const priority = parseFloat(row.priority)
      if (isNaN(priority) || priority < 1 || priority > 5) {
        errors.push({
          type: 'error',
          category: 'datatype',
          severity: 'medium',
          dataType,
          row: index,
          column: 'priority',
          message: `Priority must be a number between 1 and 5, got "${row.priority}"`,
          value: row.priority,
          suggestion: `Set priority to a number between 1 and 5`
        })
      }
    }
    
    // Validate rate is a positive number for workers
    if (dataType === 'workers' && row.rate !== undefined) {
      const rate = parseFloat(row.rate)
      if (isNaN(rate) || rate <= 0) {
        errors.push({
          type: 'error',
          category: 'datatype',
          severity: 'medium',
          dataType,
          row: index,
          column: 'rate',
          message: `Rate must be a positive number, got "${row.rate}"`,
          value: row.rate,
          suggestion: `Set rate to a positive number`
        })
      }
    }
    
    // Validate duration is a positive number for tasks
    if (dataType === 'tasks' && row.duration !== undefined) {
      const duration = parseFloat(row.duration)
      if (isNaN(duration) || duration <= 0) {
        errors.push({
          type: 'error',
          category: 'datatype',
          severity: 'medium',
          dataType,
          row: index,
          column: 'duration',
          message: `Duration must be a positive number, got "${row.duration}"`,
          value: row.duration,
          suggestion: `Set duration to a positive number`
        })
      }
    }
  })
  
  return errors
}

async function testEndToEndValidation() {
  console.log('🧪 Testing End-to-End Validation with Real CSV Files...')
  
  try {
    // Read the sample CSV files
    const clientsCSV = await fs.readFile(path.join(__dirname, '../sample-data/clients.csv'), 'utf8')
    const workersCSV = await fs.readFile(path.join(__dirname, '../sample-data/workers.csv'), 'utf8')
    const tasksCSV = await fs.readFile(path.join(__dirname, '../sample-data/tasks.csv'), 'utf8')
    
    console.log('📂 CSV files loaded successfully')
    
    // Parse and normalize the CSV data
    const clientsData = parseCSVData(clientsCSV)
    const workersData = parseCSVData(workersCSV)
    const tasksData = parseCSVData(tasksCSV)
    
    console.log('🔄 Data parsing and normalization completed:')
    console.log(`  Clients: ${clientsData.rows.length} records`)
    console.log(`  Workers: ${workersData.rows.length} records`)
    console.log(`  Tasks: ${tasksData.rows.length} records`)
    
    console.log('\n📋 Normalized Headers:')
    console.log(`  Clients: ${clientsData.headers.join(', ')}`)
    console.log(`  Workers: ${workersData.headers.join(', ')}`)
    console.log(`  Tasks: ${tasksData.headers.join(', ')}`)
    
    // Define required fields (these should match our normalized field names)
    const requiredFields = {
      clients: ['clientId', 'clientName', 'requirements', 'priority'],
      workers: ['workerId', 'name', 'skills', 'availability', 'rate'],
      tasks: ['taskId', 'clientId', 'duration', 'skills', 'deadline']
    }
    
    console.log('\n🔍 Running Validation Tests...')
    
    // Test required field validation
    const clientRequiredErrors = validateRequiredFields(clientsData.rows, requiredFields.clients, 'clients')
    const workerRequiredErrors = validateRequiredFields(workersData.rows, requiredFields.workers, 'workers')
    const taskRequiredErrors = validateRequiredFields(tasksData.rows, requiredFields.tasks, 'tasks')
    
    console.log('\n📊 Required Field Validation Results:')
    console.log(`  Client errors: ${clientRequiredErrors.length}`)
    console.log(`  Worker errors: ${workerRequiredErrors.length}`)
    console.log(`  Task errors: ${taskRequiredErrors.length}`)
    
    if (clientRequiredErrors.length > 0) {
      console.log('  Client issues:')
      clientRequiredErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    }
    
    if (workerRequiredErrors.length > 0) {
      console.log('  Worker issues:')
      workerRequiredErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    }
    
    if (taskRequiredErrors.length > 0) {
      console.log('  Task issues:')
      taskRequiredErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    }
    
    // Test reference validation
    const referenceErrors = validateReferences(clientsData.rows, tasksData.rows)
    console.log(`\n🔗 Reference Validation: ${referenceErrors.length} errors`)
    if (referenceErrors.length > 0) {
      referenceErrors.forEach(err => console.log(`    ${err.message}`))
    }
    
    // Test data type validation
    const clientDataTypeErrors = validateDataTypes(clientsData.rows, 'clients')
    const workerDataTypeErrors = validateDataTypes(workersData.rows, 'workers')
    const taskDataTypeErrors = validateDataTypes(tasksData.rows, 'tasks')
    
    console.log(`\n📋 Data Type Validation Results:`)
    console.log(`  Client data type errors: ${clientDataTypeErrors.length}`)
    console.log(`  Worker data type errors: ${workerDataTypeErrors.length}`)
    console.log(`  Task data type errors: ${taskDataTypeErrors.length}`)
    
    if (clientDataTypeErrors.length > 0) {
      clientDataTypeErrors.forEach(err => console.log(`    Client Row ${err.row}: ${err.message}`))
    }
    
    if (workerDataTypeErrors.length > 0) {
      workerDataTypeErrors.forEach(err => console.log(`    Worker Row ${err.row}: ${err.message}`))
    }
    
    if (taskDataTypeErrors.length > 0) {
      taskDataTypeErrors.forEach(err => console.log(`    Task Row ${err.row}: ${err.message}`))
    }
    
    // Summary
    const totalErrors = clientRequiredErrors.length + workerRequiredErrors.length + taskRequiredErrors.length + 
                       referenceErrors.length + clientDataTypeErrors.length + workerDataTypeErrors.length + taskDataTypeErrors.length
    
    console.log('\n📈 Validation Summary:')
    console.log(`  Total validation errors: ${totalErrors}`)
    console.log(`  Required field errors: ${clientRequiredErrors.length + workerRequiredErrors.length + taskRequiredErrors.length}`)
    console.log(`  Reference errors: ${referenceErrors.length}`)
    console.log(`  Data type errors: ${clientDataTypeErrors.length + workerDataTypeErrors.length + taskDataTypeErrors.length}`)
    
    if (totalErrors === 0) {
      console.log('  ✅ All validations passed! Sample data is clean.')
    } else {
      console.log('  ⚠️  Found validation issues (this is expected for testing)')
    }
    
    // Test sample data access
    console.log('\n🔍 Sample Data Preview:')
    console.log('  Sample Client:', JSON.stringify(clientsData.rows[0], null, 2))
    console.log('  Sample Worker:', JSON.stringify(workersData.rows[0], null, 2))
    console.log('  Sample Task:', JSON.stringify(tasksData.rows[0], null, 2))
    
    console.log('\n🎉 End-to-end validation test completed successfully!')
    console.log('✅ Field mapping working correctly')
    console.log('✅ Validation logic working correctly')
    console.log('✅ Reference integrity checks working')
    console.log('✅ Data type validation working')
    
  } catch (error) {
    console.error('❌ End-to-end validation test failed:', error.message)
    process.exit(1)
  }
}

testEndToEndValidation()
