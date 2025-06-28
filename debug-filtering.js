// Debug script to test the filtering logic
require('dotenv').config({ path: '.env.local' })

// Sample test data that mimics what should be in the session
const testSessionData = {
  clients: {
    headers: ['clientId', 'clientName', 'requirements', 'priority'],
    rows: [
      { clientId: 'CLI001', clientName: 'TechCorp Solutions', requirements: 'Full-stack development team', priority: '1' },
      { clientId: 'CLI002', clientName: 'HealthFirst Medical', requirements: 'Healthcare app development', priority: '2' },
      { clientId: 'CLI003', clientName: 'GreenEnergy Co', requirements: 'Renewable energy monitoring', priority: '3' }
    ],
    rowCount: 3
  },
  workers: {
    headers: ['workerId', 'name', 'skills', 'availability', 'rate'],
    rows: [
      { workerId: 'WRK001', name: 'Alice Johnson', skills: 'React|Node.js|TypeScript', availability: 'Monday-Friday 9AM-6PM', rate: '85' },
      { workerId: 'WRK002', name: 'Bob Smith', skills: 'Python|Django|AWS', availability: 'Monday-Friday 10AM-7PM', rate: '90' }
    ],
    rowCount: 2
  }
}

// Test filter that should work
const testFilter = {
  dataType: 'clients',
  conditions: [
    {
      field: 'priority',
      operator: 'equals',
      value: '1'
    }
  ]
}

// Import the filtering function
const path = require('path')
const { applyDataFilter } = require('./src/lib/ai/data-filter.ts')

console.log('Testing applyDataFilter function...')
console.log('Test session data:', JSON.stringify(testSessionData, null, 2))
console.log('Test filter:', JSON.stringify(testFilter, null, 2))

try {
  const results = applyDataFilter(testSessionData, testFilter)
  console.log('Filter results:', JSON.stringify(results, null, 2))
} catch (error) {
  console.error('Error in filtering:', error)
}
