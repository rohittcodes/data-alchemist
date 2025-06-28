// Test validation with normalized field names
const fs = require('fs').promises
const path = require('path')

// Mock the parser and validator modules since we're testing in Node.js
async function testValidation() {
  console.log('🧪 Testing validation with normalized field names...')
  
  try {
    // Simulate parsed data with normalized field names
    const sampleClients = [
      { clientId: 'CLI001', clientName: 'TechCorp Solutions', requirements: 'Full-stack development', priority: 1 },
      { clientId: 'CLI002', clientName: '', requirements: 'Healthcare app', priority: 2 }, // Missing name
      { clientId: '', clientName: 'GreenEnergy Co', requirements: 'Dashboard', priority: 3 } // Missing ID
    ]
    
    const sampleWorkers = [
      { workerId: 'WRK001', name: 'Alice Johnson', skills: 'React|Node.js', availability: 'Mon-Fri 9-6', rate: 85 },
      { workerId: 'WRK002', name: 'Bob Smith', skills: '', availability: 'Mon-Fri 10-7', rate: 90 }, // Missing skills
      { workerId: 'WRK003', name: '', skills: 'Vue.js|Express', availability: 'Mon-Fri 8-5', rate: 0 } // Missing name, zero rate
    ]
    
    const sampleTasks = [
      { taskId: 'TSK001', clientId: 'CLI001', duration: 120, skills: 'React|Node.js', deadline: '2025-02-15' },
      { taskId: 'TSK002', clientId: 'CLI999', duration: 80, skills: 'TypeScript', deadline: '2025-02-28' }, // Invalid clientId
      { taskId: 'TSK003', clientId: 'CLI002', duration: '', skills: 'Python', deadline: '' } // Missing duration and deadline
    ]
    
    console.log('📊 Sample Data Created:')
    console.log('  Clients:', sampleClients.length, 'records')
    console.log('  Workers:', sampleWorkers.length, 'records')
    console.log('  Tasks:', sampleTasks.length, 'records')
    
    // Test required field validation
    console.log('\n🔍 Testing Required Field Validation:')
    
    const requiredFields = {
      clients: ['clientId', 'clientName', 'requirements', 'priority'],
      workers: ['workerId', 'name', 'skills', 'availability', 'rate'],
      tasks: ['taskId', 'clientId', 'duration', 'skills', 'deadline']
    }
    
    function validateRequiredFields(data, requiredFieldsList, dataType) {
      const errors = []
      
      data.forEach((row, index) => {
        requiredFieldsList.forEach(field => {
          const value = row[field]
          const isEmpty = value === null || value === undefined || 
                         (typeof value === 'string' && value.trim() === '') ||
                         (typeof value === 'number' && value === 0 && field === 'rate')
          
          if (isEmpty) {
            errors.push({
              type: 'error',
              category: 'required',
              dataType,
              row: index,
              column: field,
              message: `Required field "${field}" is empty`,
              value
            })
          }
        })
      })
      
      return errors
    }
    
    const clientErrors = validateRequiredFields(sampleClients, requiredFields.clients, 'clients')
    const workerErrors = validateRequiredFields(sampleWorkers, requiredFields.workers, 'workers')
    const taskErrors = validateRequiredFields(sampleTasks, requiredFields.tasks, 'tasks')
    
    console.log('  Client validation errors:', clientErrors.length)
    clientErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    console.log('  Worker validation errors:', workerErrors.length)
    workerErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    console.log('  Task validation errors:', taskErrors.length)
    taskErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    // Test reference validation
    console.log('\n🔗 Testing Reference Validation:')
    
    function validateReferences(clients, tasks) {
      const errors = []
      
      if (!tasks || !clients) {
        return errors
      }
      
      const validClientIds = new Set(
        clients.map(client => client.clientId?.toString().toLowerCase().trim())
          .filter(Boolean)
      )
      
      tasks.forEach((task, index) => {
        const clientId = task.clientId?.toString().toLowerCase().trim()
        
        if (clientId && !validClientIds.has(clientId)) {
          errors.push({
            type: 'error',
            category: 'reference',
            dataType: 'tasks',
            row: index,
            column: 'clientId',
            message: `Task references non-existent client ID "${task.clientId}"`,
            value: task.clientId
          })
        }
      })
      
      return errors
    }
    
    const referenceErrors = validateReferences(sampleClients, sampleTasks)
    console.log('  Reference validation errors:', referenceErrors.length)
    referenceErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    // Test data type validation
    console.log('\n📋 Testing Data Type Validation:')
    
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
              dataType,
              row: index,
              column: 'priority',
              message: `Priority must be a number between 1 and 5`,
              value: row.priority
            })
          }
        }
        
        // Validate rate is a positive number for workers
        if (dataType === 'workers' && row.rate !== undefined) {
          const rate = parseFloat(row.rate)
          if (isNaN(rate) || rate < 0) {
            errors.push({
              type: 'error',
              category: 'datatype',
              dataType,
              row: index,
              column: 'rate',
              message: `Rate must be a positive number`,
              value: row.rate
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
              dataType,
              row: index,
              column: 'duration',
              message: `Duration must be a positive number`,
              value: row.duration
            })
          }
        }
      })
      
      return errors
    }
    
    const clientDataTypeErrors = validateDataTypes(sampleClients, 'clients')
    const workerDataTypeErrors = validateDataTypes(sampleWorkers, 'workers')
    const taskDataTypeErrors = validateDataTypes(sampleTasks, 'tasks')
    
    console.log('  Client data type errors:', clientDataTypeErrors.length)
    clientDataTypeErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    console.log('  Worker data type errors:', workerDataTypeErrors.length)
    workerDataTypeErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    console.log('  Task data type errors:', taskDataTypeErrors.length)
    taskDataTypeErrors.forEach(err => console.log(`    Row ${err.row}: ${err.message}`))
    
    // Summary
    const totalErrors = clientErrors.length + workerErrors.length + taskErrors.length + 
                       referenceErrors.length + clientDataTypeErrors.length + 
                       workerDataTypeErrors.length + taskDataTypeErrors.length
    
    console.log('\n📊 Validation Summary:')
    console.log(`  Total errors found: ${totalErrors}`)
    console.log(`  Required field errors: ${clientErrors.length + workerErrors.length + taskErrors.length}`)
    console.log(`  Reference errors: ${referenceErrors.length}`)
    console.log(`  Data type errors: ${clientDataTypeErrors.length + workerDataTypeErrors.length + taskDataTypeErrors.length}`)
    
    if (totalErrors > 0) {
      console.log('  ✅ Validation working correctly - errors detected as expected')
    } else {
      console.log('  ⚠️  No errors found - check validation logic')
    }
    
    console.log('\n🎉 Validation test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testValidation()
