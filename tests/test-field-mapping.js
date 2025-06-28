// Test field mapping functionality
const fs = require('fs').promises
const path = require('path')

async function testFieldMapping() {
  console.log('🧪 Testing CSV field mapping...')
  
  try {
    // Read sample CSV files
    const clientsCSV = await fs.readFile(path.join(__dirname, '../sample-data/clients.csv'), 'utf8')
    const workersCSV = await fs.readFile(path.join(__dirname, '../sample-data/workers.csv'), 'utf8')
    const tasksCSV = await fs.readFile(path.join(__dirname, '../sample-data/tasks.csv'), 'utf8')
    
    console.log('📂 Sample CSV Headers:')
    
    // Extract headers
    const clientHeaders = clientsCSV.split('\n')[0].split(',')
    const workerHeaders = workersCSV.split('\n')[0].split(',')
    const taskHeaders = tasksCSV.split('\n')[0].split(',')
    
    console.log('  Clients:', clientHeaders)
    console.log('  Workers:', workerHeaders)
    console.log('  Tasks:', taskHeaders)
    
    // Test field normalization logic
    const FIELD_MAPPINGS = {
      'clientid': 'clientId',
      'client_id': 'clientId',
      'ClientID': 'clientId',
      'Client ID': 'clientId',
      'clientname': 'clientName',
      'client_name': 'clientName',
      'ClientName': 'clientName',
      'Client Name': 'clientName',
      'workerid': 'workerId',
      'worker_id': 'workerId',
      'WorkerID': 'workerId',
      'Worker ID': 'workerId',
      'taskid': 'taskId',
      'task_id': 'taskId',
      'TaskID': 'taskId',
      'Task ID': 'taskId',
    }
    
    function normalizeFieldName(header) {
      const trimmed = header.trim()
      if (FIELD_MAPPINGS[trimmed]) {
        return FIELD_MAPPINGS[trimmed]
      }
      
      const lowerHeader = trimmed.toLowerCase()
      if (FIELD_MAPPINGS[lowerHeader]) {
        return FIELD_MAPPINGS[lowerHeader]
      }
      
      return trimmed.replace(/[\s_-]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, char => char.toLowerCase())
    }
    
    console.log('\n🔄 Normalized Headers:')
    console.log('  Clients:', clientHeaders.map(normalizeFieldName))
    console.log('  Workers:', workerHeaders.map(normalizeFieldName))
    console.log('  Tasks:', taskHeaders.map(normalizeFieldName))
    
    // Test expected field presence
    const expectedFields = {
      clients: ['clientId', 'clientName', 'requirements', 'priority'],
      workers: ['workerId', 'name', 'skills', 'availability', 'rate'],
      tasks: ['taskId', 'clientId', 'duration', 'skills', 'deadline']
    }
    
    console.log('\n✅ Field Mapping Validation:')
    
    const normalizedClientHeaders = clientHeaders.map(normalizeFieldName)
    const normalizedWorkerHeaders = workerHeaders.map(normalizeFieldName)
    const normalizedTaskHeaders = taskHeaders.map(normalizeFieldName)
    
    // Check clients
    const missingClientFields = expectedFields.clients.filter(field => 
      !normalizedClientHeaders.includes(field)
    )
    if (missingClientFields.length === 0) {
      console.log('  ✅ Clients: All required fields present')
    } else {
      console.log('  ❌ Clients: Missing fields:', missingClientFields)
    }
    
    // Check workers  
    const missingWorkerFields = expectedFields.workers.filter(field => 
      !normalizedWorkerHeaders.includes(field)
    )
    if (missingWorkerFields.length === 0) {
      console.log('  ✅ Workers: All required fields present')
    } else {
      console.log('  ❌ Workers: Missing fields:', missingWorkerFields)
    }
    
    // Check tasks
    const missingTaskFields = expectedFields.tasks.filter(field => 
      !normalizedTaskHeaders.includes(field)
    )
    if (missingTaskFields.length === 0) {
      console.log('  ✅ Tasks: All required fields present')
    } else {
      console.log('  ❌ Tasks: Missing fields:', missingTaskFields)
    }
    
    // Test sample data parsing
    console.log('\n📋 Sample Data Test:')
    
    const clientRows = clientsCSV.split('\n').slice(1).filter(row => row.trim())
    const sampleClient = clientRows[0].split(',')
    const clientData = {}
    clientHeaders.forEach((header, index) => {
      clientData[normalizeFieldName(header)] = sampleClient[index]
    })
    
    console.log('  Sample client:', clientData)
    
    // Test reference validation
    console.log('\n🔗 Reference Validation Test:')
    
    const clientIds = clientRows.map(row => {
      const cols = row.split(',')
      return normalizeFieldName(clientHeaders[0]) === 'clientId' ? cols[0] : null
    }).filter(Boolean)
    
    const taskRows = tasksCSV.split('\n').slice(1).filter(row => row.trim())
    const sampleTask = taskRows[0].split(',')
    const taskData = {}
    taskHeaders.forEach((header, index) => {
      taskData[normalizeFieldName(header)] = sampleTask[index]
    })
    
    console.log('  Available Client IDs:', clientIds.slice(0, 3), '...')
    console.log('  Sample task clientId:', taskData.clientId)
    
    const isValidReference = clientIds.includes(taskData.clientId)
    if (isValidReference) {
      console.log('  ✅ Reference validation: Task clientId exists in clients')
    } else {
      console.log('  ❌ Reference validation: Task clientId not found in clients')
    }
    
    console.log('\n🎉 Field mapping test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testFieldMapping()
