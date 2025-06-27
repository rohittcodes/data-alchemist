const { SessionManager } = require('./src/lib/kv-store.ts')

async function testSessionPersistence() {
  console.log('Testing session persistence...')
  
  // Create a test session
  const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  console.log('Creating session:', sessionId)
  
  const session = await SessionManager.createSession(sessionId)
  console.log('Created session:', session)
  
  // Try to retrieve it
  console.log('Retrieving session...')
  const retrieved = await SessionManager.getSession(sessionId)
  console.log('Retrieved session:', retrieved)
  
  if (retrieved) {
    console.log('✅ Session persistence is working!')
  } else {
    console.log('❌ Session persistence failed')
  }
  
  // Test updating session with data
  console.log('Testing session update...')
  const mockData = {
    headers: ['id', 'name'],
    rows: [{ id: 1, name: 'Test' }],
    rowCount: 1
  }
  
  const updated = await SessionManager.addParsedData(sessionId, 'clients', mockData)
  console.log('Updated session:', updated)
  
  // Retrieve again
  const final = await SessionManager.getSession(sessionId)
  console.log('Final session:', final)
  
  if (final && final.clients) {
    console.log('✅ Session data persistence is working!')
  } else {
    console.log('❌ Session data persistence failed')
  }
  
  // Clean up
  await SessionManager.deleteSession(sessionId)
  console.log('Test completed')
}

testSessionPersistence().catch(console.error)
